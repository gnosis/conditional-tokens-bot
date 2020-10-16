const fetch = require('node-fetch');

module.exports.getQuestion = (questionId) => {
  const jsonQuery = { query: `{  questions(  where: {    id: \"${questionId}\"  }  ) { id outcomes title category }}` }

  const promise = fetch(process.env.THE_GRAPH_OMEN, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    if(json.errors) {
      throw new Error(json.errors.map(message));
    }
    return json.data.questions && json.data.questions.map(question => 
      ({
        title: question.title,
        outcomes: question.outcomes,
        category: question.category,
      })
    );
  });

  return promise;
}