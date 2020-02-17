# squid-eval
- Simple expression/rule evaluator with minimal syntax.
- Write expression in natural language.
- Easily use in front-end or back-end.
- It will reduce the coding effort, logic can be written as Json or DB data.
- Can use this to show a conditional content/input-field on UI.
- Customize operators symbols.

# How it works
```
import RuleEvaluator from 'squid-eval'

const evaluator = new RuleEvaluator();
evaluator.parse('Toronto Rule', "[city] = Toronto and [day of birth] > 20 or [name] = Wendy's");

console.log(evaluator.execute('Toronto Rule', {
    city: 'Toronto',
    'day of birth': 23,
    name: "Wendy's"
}));
// output will be true
```
# Syntax
Only two things to know
- Variables are to be put within square brackets. e.g. [day of birth]
- If need to use operator symbols or square brackets as text to be compared, 
then just put it in side single quotes. e.g. [formula] = '2 + [3]'.
And to use quote inside quoted text, jsut use it twice. e.g. [name] = 'Macy''s'

# Customizing operators
Default operators available are: +, -, *, /, =, !=, >, <, and, or, contains
<br/>
Want to add more of your own? Below are the APIs can be used.
- addOperator() to add a new operation
- deleteOperator() to delete an operator
- clearOperators() to delete all the operators
- changeOperatorSymbol() to change symbol of an existing operator. e.g. say you don't like to use '=', instead would prefer using 'is' as in a rule '[city] is Toronto'
