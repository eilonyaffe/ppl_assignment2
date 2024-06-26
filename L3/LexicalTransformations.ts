import { ClassExp, ProcExp, Exp, Program, makeProcExp, makePrimOp, makeVarDecl, makeIfExp, makeLitExp, IfExp, isExp, isProgram, makeProgram, isAtomicExp, isClassExp } from "./L3-ast";
import { VarDecl, CExp, Binding, makeAppExp, makeVarRef, makeBoolExp, isIfExp, isAppExp, isProcExp, isCExp, isDefineExp, makeDefineExp} from "./L3-ast"; 
import { makeSymbolSExp } from "./L3-value";
import { Result, makeOk } from "../shared/result"; 
import { map } from "ramda";
/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/

export const makeNestedifs = (methods: Binding[]): IfExp => 
    methods.length == 1 ? makeIfExp(makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(methods[0].var.var))]), makeAppExp(methods[0].val, []), makeBoolExp(false)):
    makeIfExp(makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(methods[0].var.var))]), makeAppExp(methods[0].val, []), makeNestedifs(methods.slice(1)))


export const class2proc = (exp: ClassExp): ProcExp => {
    const args: VarDecl[] = exp.fields;
    const body: CExp[] = [makeProcExp(([makeVarDecl("msg")]), [makeNestedifs(exp.methods)])];
    return makeProcExp(args, body);
}


/*
Purpose: Transform all class forms in the given AST to procs
Signature: lexTransform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const lexTransform = (exp: Exp | Program): Result<Exp | Program> =>{
    //@TODO
    const rewriteAllClassCExp = (exp: CExp): CExp => 
        isAtomicExp(exp) ? exp :
        isIfExp(exp) ? makeIfExp(rewriteAllClassCExp(exp.test),
        rewriteAllClassCExp(exp.then),
        rewriteAllClassCExp(exp.alt)) :
        isAppExp(exp) ? makeAppExp(rewriteAllClassCExp(exp.rator),
        map(rewriteAllClassCExp, exp.rands)) :
        isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllClassCExp, exp.body)) :
        isClassExp(exp) ? class2proc(exp) :
        exp;

    const rewriteAllClassExp = (exp: Exp): Exp =>
        isCExp(exp) ? rewriteAllClassCExp(exp) :
        isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllClassCExp(exp.val)) :
        exp;

    const transformed: Exp | Program = isExp(exp) ? rewriteAllClassExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllClassExp, exp.exps)) :
    exp;
    return makeOk(transformed);
}
