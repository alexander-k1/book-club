function showRows(firstRow, lastRow, tablePage) {
  tablePage.classList.add("t-pag-active");
  tablePage.style.backgroundColor = "#8B008B";
  tablePage.style.color = "#fff";
  let siblings = getSiblings(tablePage);
  let prevPage = filterSiblings(siblings);
  if (prevPage > -1) {
    siblings[prevPage].classList.toggle("t-pag-active");
    siblings[prevPage].style.backgroundColor = "transparent";
    siblings[prevPage].style.color = "black";
  }
  let table = document.getElementById(
    tablePage.parentElement.parentElement.previousElementSibling.id
  );
  let rows = getRows(table);
  let rowsLength = rows.length;
  for (let k = 0; k < firstRow - 1; k++) {
    rows[k].style.display = "none";
  }
  for (let i = firstRow - 1; i <= lastRow - 1; i++) {
    if (rowsLength > i) {
      rows[i].style.display = "table-row";
    }
  }
  for (let j = lastRow; j < rowsLength; j++) {
    rows[j].style.display = "none";
  }
}
function getSiblings(elem) {
  var siblings = [];
  var sibling = elem.parentNode.firstChild;

  while (sibling) {
    if (sibling.nodeType === 1 && sibling !== elem) {
      siblings.push(sibling);
    }
    sibling = sibling.nextSibling;
  }
  return siblings;
}
function filterSiblings(siblings) {
  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i].classList.contains("t-pag-active")) {
      return i;
    }
  }
  return -1;
}
function getRows(table) {
  let tableChildren = table.children;
  let rows = [];
  Array.from(tableChildren).forEach((ele) => {
    if (ele.tagName.toLowerCase() == "tbody") {
      let tbodyChildren = ele.getElementsByTagName("tr");
      Array.from(tbodyChildren).forEach((tbodyEle) => {
        rows.push(tbodyEle);
      });
    } else if (ele.tagName.toLowerCase() == "tr") {
      rows.push(ele);
    }
  });
  return rows;
}
function arrowBack(tableId, numRows) {
  let table = document.getElementById(tableId);
  let pages = table.nextElementSibling.children[1].children;
  let pagesLength = pages.length;
  let currentActive = filterSiblings(pages);
  if (currentActive > -1) {
    if (currentActive > 0) {
      showRows(
        currentActive * numRows - (numRows - 1),
        currentActive * numRows,
        pages[currentActive - 1]
      );
    }
  }
}
function arrowForward(tableId, numRows) {
  let table = document.getElementById(tableId);
  let pages = table.nextElementSibling.children[1].children;
  let pagesLength = pages.length;
  let currentActive = filterSiblings(pages);
  if (currentActive > -1) {
    if (currentActive < pagesLength - 1) {
      showRows(
        (currentActive + 2) * numRows - (numRows - 1),
        (currentActive + 2) * numRows,
        pages[currentActive + 1]
      );
    }
  }
}
function addPagination(tableId, numRows) {
  let table = document.getElementById(tableId);
  let rows = getRows(table);
  let rowsLength = rows.length;
  let numPages = Math.ceil(rowsLength / numRows);
  let paginationDiv = `<div class='t-pag-pagination' id='${tableId}-pagination' style='font-family:sans-serif'><div class='pagArrowBack' onclick='arrowBack(this.parentElement.previousElementSibling.id, ${numRows})' style='display:inline-block;cursor:pointer;'> &laquo; </div><div class='t-apg-pagination-pages' style='display:inline-block'>`;
  for (let i = 1; i <= numPages; i++) {
    paginationDiv += `<div style='display:inline-block;margin:0.5em;padding:0.2em;border:0px solid transparent;border-radius:3px;cursor:pointer;' onclick='showRows(${
      i * numRows - (numRows - 1)
    }, ${i * numRows}, this)'>${i}</div>`;
  }
  paginationDiv += `</div><div class='pagArrowForward' style='display:inline-block;cursor:pointer;' onclick='arrowForward(this.parentElement.previousElementSibling.id, ${numRows})'> &raquo; </div></div>`;
  table.insertAdjacentHTML("afterend", paginationDiv);
  showRows(1, numRows, table.nextElementSibling.children[1].firstChild);
}
let tablesToProcess = document.getElementsByClassName("t-pag");
Array.from(tablesToProcess).forEach((table) => {
  if (table.classList.contains("t-pag-5")) {
    addPagination(table.id, 5);
  } else if (table.classList.contains("t-pag-10")) {
    addPagination(table.id, 10);
  } else if (table.classList.contains("t-pag-25")) {
    addPagination(table.id, 25);
  } else if (table.classList.contains("t-pag-50")) {
    addPagination(table.id, 50);
  }
});
