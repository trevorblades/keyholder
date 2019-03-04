/* eslint-env jest */
const Keyholder = require('../packages/keyholder');

const keyholder = new Keyholder({
  projectId: process.env.TEST_PROJECT_ID,
  projectAccessKey: process.env.TEST_PROJECT_ACCESS_KEY
});

test('authenticates a valid key', async () => {
  const isValid = await keyholder.test(process.env.TEST_API_KEY);
  expect(isValid).toBe(true);
});
