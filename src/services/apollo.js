const query = async (req, res) => {
  if (!req.body || !req.body.query) {
    res.sendStatus(500);
    return;
  }

  const query = gql(req.body.query);
  let variables = undefined;
  if (req.body.variables) {
    variables = JSON.parse(decodeURIComponent(req.body.variables));
  }

  try {
    const result = await client.query({
      query,
      variables
    });
    res.json(result);
  } catch (err) {
    console.log(err);
    res.sendStatus(500).send(JSON.stringify(err));
  }
};

const mutate = async (req, res) => {
  if (!req.body || !req.body.query) {
    res.sendStatus(500);
    return;
  }

  const query = gql(req.body.query);
  let variables = undefined;
  if (req.body.variables) {
    variables = JSON.parse(decodeURIComponent(req.body.variables));
  }

  try {
    const result = await client.mutate({
      query,
      variables
    });
    res.json(result);
  } catch (err) {
    console.log(err);
    res.sendStatus(500).send(JSON.stringify(err));
  }
};

const apollo = async (req, res, next) => {
    switch (req.method) {
      case "POST":
      case "PUT":
        await mutate(req, res);
        break;
   
      case "GET":
      default:
        await query(req, res);
    }
   
    next();
  };
   
   
  module.exports = apollo;