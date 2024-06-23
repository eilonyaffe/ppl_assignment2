import { ClassExp, ProcExp, Exp, Program, makeProcExp, makePrimOp, makeVarDecl, makeIfExp, makeLitExp, IfExp, isExp, isProgram, makeProgram, isAtomicExp, makeLetExp, isClassExp } from "./L3-ast";
//import { Result, makeFailure } from "../shared/result";
import { VarDecl, CExp, Binding, makeAppExp, makeVarRef, makeBoolExp, makeStrExp, isIfExp, isAppExp, isProcExp, isLetExp, isCExp, isDefineExp, makeDefineExp} from "./L3-ast"; //new
import { makeSymbolSExp } from "./L3-value";
import { Result, makeOk, makeFailure, bind, mapResult, mapv } from "../shared/result"; //new
import { map, zipWith } from "ramda";
/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/

export const makeNestedifs = (methods: Binding[]): IfExp => {
    const curr = methods[0];
    return (methods.length == 1 ? makeIfExp(makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(curr.var.var))]), makeAppExp(curr.val, []), makeBoolExp(false)):
    makeIfExp(makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(curr.var.var))]), makeAppExp(curr.val, []), makeNestedifs(methods.slice(1))))
}

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

    const transformed = isExp(exp) ? rewriteAllClassExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllClassExp, exp.exps)) :
    exp;

    return makeOk(transformed);
}
