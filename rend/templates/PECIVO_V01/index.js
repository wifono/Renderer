var template = document.querySelector("#template .label");
var content = document.querySelector(".content");
var fragment;
var curPage;

// add new page to fragment
function addPage() {
  curPage = document.createElement("div");
  curPage.setAttribute("class", "page");
  fragment.appendChild(curPage);
}

// add new label to curPage
function addLabel(data) {
  // clone template
  var newLabel = template.cloneNode(true);
  // for each data attribute
  for (var key in data) {
    // select all element with class name == .atributeKey
    var els = newLabel.querySelectorAll("." + key);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (key === "barcode") {
        // if atribute is barcode
        // set svg attributes
        el.setAttribute("jsbarcode-width", "1");
        el.setAttribute("jsbarcode-height", "19");
        el.setAttribute("jsbarcode-displayvalue", "false");
        el.setAttribute("jsbarcode-textmargin", "-5");
        el.setAttribute("jsbarcode-background", "transparent");
        el.setAttribute("jsbarcode-value", data[key]);
        el.setAttribute("jsbarcode-format", "EAN" + data[key].length);
      } else {
        // set content
        el.textContent = data[key];
      }
    }
  }
  curPage.appendChild(newLabel);
}

// parse item return data
function parseItem(item) {
  var display = item.querySelector("Display");
  var price = item.querySelector("ItemPrice").textContent.replace(",", ".");
  var shelf = item.querySelector("ShelfAddress").textContent;
  var data = {
    name: display.querySelector("Name").textContent,
    ean: display.querySelector("CodesDescription").textContent,
    barcode: display.querySelector("DefaultEAN").textContent,
    price: Math.floor(price),
    "price-frac": ("0" + String(Math.floor((100 * price) % 100))).substr(-2),
    // 'price-frac': String(Math.floor((100 * price) % 100)).padStart(2, '0'),
    "price-old": display.querySelector("PriceOld").textContent.slice(0, -1),
    discount: display
      .querySelector("PriceGlyph")
      .textContent.replace("C", "F")
      .replace("B", "C")
      .replace("N", "q"),
    "discount-per": display
      .querySelector("PriceDiscount")
      .textContent.replace(/[\s-]/g, ""),
    "price-unit": display.querySelector("PriceUnitText").textContent,
    shelf: shelf,
    description: display.querySelector("Description1").textContent,
    description2: display.querySelector("Description2").textContent,
    supplier: display.querySelector("SupplierText").textContent,
  };
  return data;
}

// parse xml document
function xmlParser(xmlDoc) {
  var batchId = xmlDoc.querySelector("BatchID");
  console.log("BatchID:", batchId.textContent);
  // create fragment
  fragment = document.createDocumentFragment();
  // get all items
  var items = xmlDoc.getElementsByTagName("Item");
  var curLabel = 0;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var itemId = item.querySelector("ItemID");
    if (itemId.getAttribute("Type") === "Separator") {
      // break page if not empty page
      if (curLabel !== 0) {
        addPage();
      }
      // add empty page if requested
      if (itemId.textContent === "EmptyPage") {
        addPage();
      }
      curLabel = 0;
    } else {
      if (curLabel % 21 === 0) {
        // break page after 21 labels on page
        addPage();
        curLabel = 0;
      }
      var data = parseItem(item);
      addLabel(data);
      curLabel++;
    }
  }
  content.appendChild(fragment);
}

// eslint-disable-next-line no-unused-vars
async function setPageData(data) {
  // get xml dokument
  // var xhttp = new XMLHttpRequest()
  // xhttp.open('GET', data.url, false)
  // xhttp.send()
  // xmlParser(xhttp.responseXML)
  const response = await fetch(data.url);
  const str = await response.text();
  const xml = new window.DOMParser().parseFromString(str, "text/xml");
  xmlParser(xml);
  // init barcodes
  window.JsBarcode("svg[jsbarcode-value]").init();
}
