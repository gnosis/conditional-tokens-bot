const fetch = require('node-fetch');
const _ = require("lodash/collection");

module.exports.getQuestion = (questionId) => {
  const jsonQuery = { query: `{  questions(  where: {    id: \"${questionId}\"  }  ) { id templateId outcomes title category }}` }

  const promise = fetch(process.env.THE_GRAPH_GET_OMEN_QUESTIONS, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonQuery),
    method: "POST",
  }).then(res => res.json())
  .catch(error => console.error('Error:', error))
  .then(json => {
    const questions = new Array();
    _.forEach(json.data.questions, question => {
      questions.push({
        title: question.title,
        outcomes: question.outcomes,
        category: question.category,
        language: question.language,
      })
    });
    return questions;
  });

  return promise;
}