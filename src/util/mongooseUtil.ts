//https://jira.mongodb.org/browse/NODE-2014
export const withTransaction = async (session, closure) => {
  let result;
  await session.withTransaction(() => {
    result = closure();
    return result;
  });
  return result;
};
