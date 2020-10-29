let submitButton = document.querySelector("#sign-up-submit-login");
async function findUsername(username) {//obtain list of users with this username
  let response = await fetch(
    `/api/users?username=${username}`
  );
  return response.json();
}
async function checkUsername() {
  submitButton.disabled = true;//disable the submit button until response is obtained
  let username = document.querySelector("#sign-up-username");
  let users = await findUsername(username.value);
  if (typeof(users) == "object" && users.length) {//if a user is found, then this username is already taken
    let existingUsername = users[0].username;
    if (existingUsername.toLowerCase() == username.value.toLowerCase()) {
      username.setCustomValidity(`The user "${username.value}" already exists`);
      username.reportValidity();
    }
  } else if (users == 'Error') {
    username.setCustomValidity("Sorry, currently unavalaible");
    username.reportValidity();
  } else {
    username.setCustomValidity("");
    username.reportValidity();
    submitButton.disabled = false;//remove disabled property
  }
}
