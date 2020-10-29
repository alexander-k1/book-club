let books = document.getElementsByClassName("swap-choice");
let submitButton = document.querySelector("#submit-swap");
let bookToOffer;
if (books.length > 0) {
  books[0].checked = "checked";//check the top book on the list by default
  bookToOffer = books[0];
  checkRequest();//invoke checkRequest for this default choice
}
function findCheckedOne(arr) {
  let i = 0;
  while (i < arr.length) {
    if (arr[i].checked) {
      return i;
    }
    i++;
  }

  return undefined;
}
async function findRequest(bookToObtain, bookToOffer) {
  let response = await fetch(//obtain a list of requests with the same parameters
`/api/requests?booktoobtain=${bookToObtain}&booktooffer=${bookToOffer}`
  );
  return response.json();
}
async function checkRequest() {
  submitButton.disabled = true;//disable the submit button until response is obtained
  bookToOffer.setCustomValidity("");
  bookToOffer.reportValidity();
  let bookToObtain = document.querySelector("#book-to-obtain-id").innerText;
  bookToOffer = books[findCheckedOne(books)];
  let requests = await findRequest(bookToObtain, bookToOffer.value);
  if (typeof(requests) == "object" && requests.length) {//if a similar request exists, then it's not allowed to make another one
    let existingRequestBookId = requests[0].swaps[0]._id.valueOf();
    if (existingRequestBookId == bookToOffer.value) {
      bookToOffer.setCustomValidity(
        `You already have a similar pending request`
      );
      bookToOffer.reportValidity();
    }
  } else {
    bookToOffer.setCustomValidity("");
    bookToOffer.reportValidity();
    submitButton.disabled = false;//remove disabled property
  }
}
