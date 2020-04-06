/*
    Could simply use eval function, but it can lead to script injections.
    Here only logical and arithmetic operations are processed.
    This module is converting the rule string into prefix notation to evaluate.
    Anything put within single quotes is considered as string. No need of escape sign
    for code keys, just put it within single quotes. And to use a single quote in a text
    simply type it two times ('').
    Variables are to be put between square brackets (can have spaces). e.g. [my variable name]
*/
import { TextPatterns } from './TextParser';
import { InvalidExpError, RuleExistsError, RuleNotExistsError } from '../errors';
import { RuleName } from '../types';
import { nonNull, toNumOrStr } from 'squid-utils';

const textPattern: TextPatterns = {
  split: /('(?:[^']|'')*')/g,
  extract: /'((?:[^']|'')*)'/g,
  replace: [{
    subText: '\'\'',
    replacement: '\''
  }]
};

interface Operator {
  priority: number;
  operate: (left: string, right: string) => any;
}

type Operators = Map<string, Operator>

const defaultOperators: Operators = new Map();

defaultOperators.set(' + ', {
  priority: 0,
  operate: (left: any, right: any) => parseFloat(left) + parseFloat(right)
});
defaultOperators.set(' - ', {
  priority: 0,
  operate: (left: any, right: any) => parseFloat(left) - parseFloat(right)
});
defaultOperators.set(' * ', {
  priority: -1,
  operate: (left: any, right: any) => parseFloat(left) * parseFloat(right)
});
defaultOperators.set(' / ', {
  priority: -1,
  operate: (left: any, right: any) => parseFloat(left) / parseFloat(right)
});
defaultOperators.set(' = ', {
  priority: 1,
  operate: (left: any, right: any) => (toNumOrStr(left) === toNumOrStr(right))
});
defaultOperators.set(' != ', {
  priority: 1,
  operate: (left: any, right: any) => (toNumOrStr(left) !== toNumOrStr(right))
});
defaultOperators.set(' > ', {
  priority: 1,
  operate: (left: any, right: any) => (toNumOrStr(left) > toNumOrStr(right))
});
defaultOperators.set(' < ', {
  priority: 1,
  operate: (left: any, right: any) => (toNumOrStr(left) < toNumOrStr(right))
});
defaultOperators.set(' contains ', {
  priority: 1,
  operate: (left: any, right: any) => {
    if (Array.isArray(left)) {
      left = left.map(item => item.toString());
    } else {
      left = left.toString();
    }
    return left.includes(right.toString());
  }
});
defaultOperators.set(' and ', {
  priority: 2,
  operate: (left: any, right: any) => (left && right)
});
defaultOperators.set(' or ', {
  priority: 2,
  operate: (left: any, right: any) => (left || right)
});

interface RuleExpPart {
  text?: string;
  variable?: string;
  operator?: string;
  other?: string;
}

export default class RuleEvaluator {
  private operators: Operators;
  private opsRegex = / /g;
  private variablePattern: TextPatterns = {
    split: /(\[(?:[^[\]])*\])/g,
    extract: /\[((?:[^[\]])*)\]/g
  };
  private prefixExp: Map<RuleName, RuleExpPart[]> = new Map<string | number, RuleExpPart[]>();

  constructor () {
    this.operators = new Map(defaultOperators);
    this.updateOpsRegex();
  }

  private updateOpsRegex () {
    this.opsRegex = this.opsRegexFn();
  }

  addOperator (operator: string, detail: Operator) {
    this.operators.set(operator, detail);
    this.updateOpsRegex();
  }

  deleteOperator (operator: string) {
    this.operators.delete(operator);
    this.updateOpsRegex();
  }

  clearOperators () {
    this.operators.clear();
    this.updateOpsRegex();
  }

  changeOperatorSymbol (currentSymbol: string, newSymbol: string, keepCurrent = false) {
    if (!this.operators.has(currentSymbol)) throw `Operator ${currentSymbol} doesn't exist.`;
    this.operators.set(newSymbol, this.operators.get(currentSymbol) as Operator);
    if (!keepCurrent) this.operators.delete(currentSymbol);
    this.updateOpsRegex();
  }

  private getOps () {
    return Array.from(this.operators.keys());
  }

  private opsRegexFn () {
    const opsReg = this.getOps().map(op => `[${Array.from(op).join('][')}]`).join('|');
    return new RegExp(`(${opsReg}|[(]|[)])`, 'gi');
  }

  private getPriority (op: string): number {
    return this.operators.get(op)?.priority || 0;
  }

  private isOp = (str: string) => {
    return this.getOps().includes(str.toLowerCase());
  };

  private execOp (left: string, op: string, right: string) {
    return this.operators.get(op)?.operate(left, right);
  }

  private splitParts (exp: string): RuleExpPart[] {
    const parts: RuleExpPart[] = [];
    let matches: any;
    for (const item of exp.split(textPattern.split)) {
      matches = textPattern.extract.exec(item);
      if (matches) {
        let text: string = matches[1];
        textPattern.replace?.forEach(rep => {
          text = text.replace(new RegExp(rep.subText, 'g'), rep.replacement);
        });
        parts.push({ text });
      } else {
        for (const varPart of item.split(this.variablePattern.split)) {
          matches = this.variablePattern.extract.exec(varPart);
          if (matches) {
            parts.push({ variable: matches[1] });
          } else {
            for (let part of varPart.split(this.opsRegex)) {
              if (this.isOp(part)) {
                parts.push({ operator: part });
              } else {
                part = part.trim();
                if (part.length > 0) {
                  parts.push({ other: part });
                }
              }
            }
          }
        }
      }
    }
    return parts;
  }

  private infixToPrefix (exp: string): RuleExpPart[] {
    const res: RuleExpPart[] = [];
    const parts: RuleExpPart[] = this.splitParts(exp);
    const stack: RuleExpPart[] = [];
    for (let i = parts.length - 1; i >= 0; i--) {
      const partObj = parts[i];
      if (partObj.operator) {
        const part = partObj.operator.toLowerCase();
        while (stack.length > 0 && stack[stack.length - 1].operator && this.getPriority(stack[stack.length - 1].operator || '') < this.getPriority(part)) {
          res.push(nonNull(stack.pop()));
        }
        stack.push(partObj);
      } else if (partObj.other === ')') {
        stack.push(partObj);
      } else if (partObj.other === '(') {
        while (stack.length > 0 && ![')', '('].includes(stack[stack.length - 1].other || '')) {
          res.push(nonNull(stack.pop()));
        }
        if (stack.length == 0 || stack[stack.length - 1] === '(') {
          throw new InvalidExpError(exp);
        }
        stack.pop();
      } else {
        res.push(partObj);
      }
    }

    if (stack.find(expPart => [')', '('].includes(expPart.other || ''))) {
      throw new InvalidExpError(exp);
    }

    while (stack.length > 0) {
      res.push(nonNull(stack.pop()));
    }
    return res.reverse();
  }

  /**
   * Pre processes by parsing the rule expression and keeps in cache with the rule name given as key.
   * @param ruleName
   * @param rule
   * @throws error is thrown if the rule name is already used. Please call update if wanting to update the rule.
   */
  parse (ruleName: RuleName, rule: string) {
    if (this.prefixExp.has(ruleName)) {
      throw new RuleExistsError(ruleName);
    }
    this.update(ruleName, rule);
  }

  /**
   * Update an existing rule name cache with new rule expression.
   * @param ruleName
   * @param newRule
   */
  update (ruleName: RuleName, newRule: string) {
    const processedExp = this.infixToPrefix(newRule);

    try {
      const dummyData = this.getFields(processedExp)
        .reduce((obj: any, variable: string) => {
          obj[variable] = '1';
          return obj;
        }, {});
      this.evaluateRule(processedExp, dummyData);
    } catch (e) {
      throw new InvalidExpError(newRule);
    }

    this.prefixExp.set(ruleName, processedExp);
  }

  /**
   * Delete saved rule.
   * @param ruleName
   */
  delete (ruleName: RuleName) {
    this.prefixExp.delete(ruleName);
  }

  private getFields (prefixExp: RuleExpPart[]): string[] {
    return prefixExp.filter(item => item.variable).map(item => item.variable as string);
  }

  /**
   * Get all the variables used in the rule expression
   * @param ruleName
   */
  getVariables (ruleName: RuleName) {
    const ruleExpParts = this.prefixExp.get(ruleName)
    if (ruleExpParts) {
      return this.getFields(ruleExpParts);
    } else {
      throw new RuleNotExistsError(ruleName);
    }
  }

  private getValue (part: RuleExpPart, data: any) {
    if (part.variable) {
      return data[part.variable];
    }
    return part.other ?? part.text;
  }

  private evaluateRule (prefixExp: RuleExpPart[], data: any) {
    const stack: RuleExpPart[] = [];
    for (const item of prefixExp) {
      if (item.operator || stack[stack.length - 1].operator) {
        stack.push(item);
      } else {
        let left, right = this.getValue(item, data);
        do {
          left = this.getValue(nonNull(stack.pop()), data);

          right = this.execOp(left, nonNull(stack.pop()?.operator), right);
        } while (stack.length > 0 && !stack[stack.length - 1].operator);

        if (stack.length === 0) return right;

        stack.push({ other: right });
      }
    }
    throw new InvalidExpError('');
  }

  execute (ruleName: RuleName, data: any) {
    const prefixExp = this.prefixExp.get(ruleName);
    if (prefixExp) {
      try {
        return this.evaluateRule(prefixExp, data);
      } catch (e) {
        throw new InvalidExpError(`with rule name: '${String(ruleName)}'`);
      }
    }
    throw new RuleNotExistsError(ruleName);
  }
}
