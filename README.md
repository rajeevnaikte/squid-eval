# squid-eval
Writing logic in natural language way. 
(Could use eval() function of JS, but it can lead to code injection)
- Simple expression/rule evaluator with minimal syntax.
- Write expression in natural language.
- Write conditional logic or math calculation or both.
- Easily use in front-end or back-end.
- Reduce the coding effort with the logic written as Json or DB data.
- Can use this to show a conditional content/input-field on UI.
- Customize operators symbols.

# How it works
```javascript 1.8
import { RuleEvaluator } from 'squid-eval'

const evaluator = new RuleEvaluator();
evaluator.parse('Toronto Rule', "[city] = Toronto and [day of birth] > 20 or [name] = Wendy's");

console.log(evaluator.execute('Toronto Rule', {
    city: 'Toronto',
    'day of birth': 23,
    name: "Wendy's"
}));
// output will be true
```
Handles parenthesized expressions as well.
```javascript 1.8
evaluator.parse('Toronto 2nd Rule', "[city] = Toronto and ([day of birth] + 10 < 20 or [name] = Wendy's)");
console.log(evaluator.execute('Toronto Rule', {
    city: 'Toronto',
    'day of birth': 23,
    name: "Starbucks"
}));
// output will be false
```
# Syntax
Only two things to know
- Variables are to be put within square brackets. e.g. [day of birth]
- If need to use operator symbols or square brackets as a plain text,
then just put it in side single quotes. e.g. [formula] = '2 + [3]'.
And to use quote inside quoted text, just use it twice. e.g. [name] = 'Macy''s'

# Validation
- Call parse() method which will throw error if expression has issue.
- Call getVariables() and check if the required variables are extracted.

# Customizing operators
Default operators available are: +, -, *, /, =, !=, >, <, and, or, contains
<br/>
Want to add more of your own? Below are the APIs can be used.
- addOperator() to add a new operation
- deleteOperator() to delete an operator
- clearOperators() to delete all the operators
- changeOperatorSymbol() to change symbol of an existing operator. e.g. say you don't like to use '=', instead would prefer using 'is' as in a rule '[city] is Toronto'

# Rule Action Service
Optional service to evaluate rules and find actions to take.
- RuleActionService:
  - add (ruleName, action: string, rule: string)
  - update (ruleName, action: string, rule: string)
  - delete (ruleName, action: string)
  - evaluateActions (ruleName, formData: JsonType): string[]<br/>
    Returns list of actions to be taken based on rules setup.
<br/>
```javascript 1.8
import { RuleActionService } from 'squid-eval';

const inputFieldActionsService = new RuleActionService();
inputFieldActionsService.add('underAgeDisclaimer', 'show', '[age] < 18');

const formData = { age: 16 };
inputFieldActionsService.evaluateActions('underAgeDisclaimer', formData); // ['show']
```
