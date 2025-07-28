// TEST USERNAME VALIDATION
// Execute this in browser console to test username validation

function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return 'Username must be 3-20 characters, letters, numbers and underscore only';
  }
  return null;
}

// Test cases
const testUsernames = ['dumbo', 'test', 'a', 'verylongusername123', 'user-name', 'user@name'];

console.log('=== USERNAME VALIDATION TEST ===');
testUsernames.forEach(username => {
  const result = validateUsername(username);
  console.log(`"${username}" (${username.length} chars): ${result || 'VALID'}`);
});
console.log('=== END TEST ===');

// Expected results:
// "dumbo" (5 chars): VALID
// "test" (4 chars): VALID  
// "a" (1 chars): Username must be 3-20 characters, letters, numbers and underscore only
// "verylongusername123" (18 chars): VALID
// "user-name" (9 chars): Username must be 3-20 characters, letters, numbers and underscore only
// "user@name" (9 chars): Username must be 3-20 characters, letters, numbers and underscore only 