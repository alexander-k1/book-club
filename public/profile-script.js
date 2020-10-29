var modal;
var bookToDelete;
var ownBookSwap;
var ownBookSwapName;
var bookToObtain;
var bookToObtainName;
var bookToObtainUsername;
var bookToReject;
var bookToRejectName;
var bookToRejectUsername;
var booksToRejectOnAccept = [];

let currentPage = 0;
let arrowForward = document.getElementById("next");
let arrowBack = document.getElementById("prev");
let historyList = document.getElementById("history-list");

function showPage(action) {//used for obtaining user history
  arrowBack.classList.remove("active");//make arrows inactive while the request is being processed
  arrowForward.classList.remove("active");
  let page;
  if (action == "forward") {
    page = currentPage + 1;
  } else if (action == "back") {
    page = currentPage - 1;
  }
  fetch(
    `https://cyber-lyrical-andesaurus.glitch.me/api/userhistory?page=${page}`,
    {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    }
  )
    .then((response) => response.json())
    .then((response) => {
      if (historyList.children) {
        while (historyList.firstChild) {
          historyList.removeChild(historyList.lastChild);
        }
      }
      response.history.forEach((ele) => {
        switch (ele.type) {
          case "req":
            historyList.innerHTML += `<li>
      <div class="bullet"></div><span>You offered to swap your book </span><span class="book-name-history">${ele.ownbookname}</span><span> for </span><span class="book-name-history">${ele.name}</span><span> belonging to ${ele.username}</span>
    </li>`;
            break;
          case "ownreq":
            historyList.innerHTML += `<li>
      <div class="bullet"></div><span>${ele.username} offered to swap their book </span><span class="book-name-history">${ele.name}</span><span> for your book </span><span class="book-name-history">${ele.ownbookname}</span>
    </li>`;
            break;
          case "ref":
            historyList.innerHTML += `<li>
      <div class="bullet"></div><span>You refused to swap your book </span><span class="book-name-history">${ele.ownbookname}</span><span> for </span><span class="book-name-history">${ele.name}</span><span> belonging to ${ele.username}</span>
    </li>`;
            break;
          case "ownref":
            historyList.innerHTML += `<li>
      <div class="bullet"></div><span>${ele.username} refused to swap their book </span><span class="book-name-history">${ele.name}</span><span> for your book </span><span class="book-name-history">${ele.ownbookname}</span>
    </li>`;
            break;
          case "deal":
            historyList.innerHTML += `<li class="deal">
      <div class="bullet"></div><span>You swapped your book </span><span class="book-name-history">${ele.ownbookname}</span><span> for </span><span class="book-name-history">${ele.name}</span><span> belonging to ${ele.username}</span>
    </li>`;
            break;
        }
      });
      switch (action) {
        case "forward":
          if (currentPage < response.historypages) {
            currentPage++;
          }
          break;
        case "back":
          if (currentPage > 1) {
            currentPage--;
          }
          break;
      }
      if (currentPage == 1) {
        arrowBack.classList.remove("active");
      } else if (!arrowBack.classList.contains("active")) {
        arrowBack.classList.add("active");
      }
      if (currentPage == response.historypages) {
        arrowForward.classList.remove("active");
      } else if (!arrowForward.classList.contains("active")) {
        arrowForward.classList.add("active");
      }
    })
    .catch((error) => {
      alert("Error:", error);
      historyList.innerHTML += `<p>User history currently unavailable</p>`;
    });
}

function clickEdit() {
  modal = document.getElementById("edit-pers-info");
  modal.style.display = "block";
}

function clickAddBook() {
  modal = document.getElementById("add-book");
  modal.style.display = "block";
}

function clickDeleteBook(event) {
  modal = document.getElementById("delete-book");
  modal.style.display = "block";
  bookToDelete = event.target.parentNode.id;
}
function filterRejected(event) {
  let bookList = Array.from(
    event.target.parentNode.parentNode.parentNode.children
  ).slice(1);
  bookList.forEach(ele => {
    if (ele !== event.target.parentNode.parentNode) {
      booksToRejectOnAccept.push({
        booktorejectname: ele.children[1].innerText.slice(0,-2),
        booktorejectusername: ele.children[2].innerText.slice(5)
      });
    }
  });
}
function clickAcceptOffer(event) {
  modal = document.getElementById("accept-offer");
  modal.style.display = "block";
  bookToObtain = event.target.parentNode.parentNode.id;
  bookToObtainName = event.target.parentNode.parentNode.children[1].innerText.slice(0,-2);
  bookToObtainUsername = event.target.parentNode.parentNode.children[2].innerText.slice(
    5
  );
  ownBookSwap = event.target.parentNode.parentNode.parentNode.parentNode.id;
  ownBookSwapName =
    event.target.parentNode.parentNode.parentNode.parentNode.children[1]
      .innerText;
  filterRejected(event);
}

function clickRejectOffer(event) {
  modal = document.getElementById("reject-offer");
  modal.style.display = "block";
  bookToReject = event.target.parentNode.parentNode.id;
  ownBookSwap = event.target.parentNode.parentNode.parentNode.parentNode.id;
  ownBookSwapName =
    event.target.parentNode.parentNode.parentNode.parentNode.children[1]
      .innerText;
  bookToRejectUsername = event.target.parentNode.parentNode.children[2].innerText.slice(
    5
  );
  bookToRejectName = event.target.parentNode.parentNode.children[1].innerText.slice(0,-2);
}

function clickCancel() {
  modal.style.display = "none";
  modal = null;
}

function clickCancelDelete() {
  bookToDelete = null;
  modal.style.display = "none";
  modal = null;
}

function clickCancelAccept() {
  ownBookSwap = null;
  ownBookSwapName = null;
  bookToObtain = null;
  bookToObtainName = null;
  bookToObtainUsername = null;
  booksToRejectOnAccept = [];
  modal.style.display = "none";
  modal = null;
}

function clickCancelReject() {
  ownBookSwap = null;
  ownBookSwapName = null;
  bookToReject = null;
  bookToRejectName = null;
  bookToRejectUsername = null;
  modal.style.display = "none";
  modal = null;
}
function postData(url, data) {
  fetch(url, {
    method: "POST",
    mode: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(response => {
      if (response == "OK") {
        location = location;
      } else if (response == "Unsuccessful") {
        alert("Error: Unsuccessful");
      } else {
        alert("Error");
      }
    })
    .catch(error => {
      alert("Error:", error);
    });
}

function postDelete() {
  var deleteRequest = { id: bookToDelete };
  postData("/api/deletebook", deleteRequest);
}

function postAccept() {
  var acceptRequest = {
    ownbookid: ownBookSwap,
    ownbookname: ownBookSwapName,
    booktoobtainid: bookToObtain,
    booktoobtainname: bookToObtainName,
    booktoobtainusername: bookToObtainUsername,
    rejected: booksToRejectOnAccept
  };
  postData("/api/acceptoffer", acceptRequest);
}

function postReject() {
  var rejectRequest = {
    ownbookid: ownBookSwap,
    ownbookname: ownBookSwapName,
    booktorejectid: bookToReject,
    booktorejectname: bookToRejectName,
    booktorejectusername: bookToRejectUsername
  };
  postData("/api/rejectoffer", rejectRequest);
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    modal = null;
    bookToReject = null;
    bookToObtain = null;
    bookToDelete = null;
    ownBookSwap = null;
    ownBookSwapName = null;
    bookToRejectName = null;
    bookToRejectUsername = null;
    bookToObtainName = null;
    bookToObtainUsername = null;
    booksToRejectOnAccept = [];
  }
};

showPage("forward");
