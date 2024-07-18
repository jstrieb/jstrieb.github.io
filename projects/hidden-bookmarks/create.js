/***
 * Created by Jacob Strieb
 * March 2021
 */


/*******************************************************************************
 * Global variables and constants
 ******************************************************************************/

let bookmarkTemplate = `
(async () => {
var b64 = (function() {
  function generateIndexDict(a) {
    let result = {};
    for (let i = 0; i < a.length; i++) {
      result[a[i]] = i;
    }
    return result;
  }

  const _a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const _aRev = generateIndexDict(_a);
  _aRev["-"] = _aRev["+"];
  _aRev["_"] = _aRev["/"];

  const _enc = new TextEncoder("utf-8");
  const _dec = new TextDecoder("utf-8");

  return {

    decode: function(s) {
      return this.binaryToAscii(this.base64ToBinary(s));
    },

    encode: function(s) {
      return this.binaryToBase64(this.asciiToBinary(s));
    },

    asciiToBinary: function(text) {
      return _enc.encode(text);
    },


    binaryToAscii: function(binary) {
      return _dec.decode(binary);
    },


    binaryToBase64: function(originalBytes) {
      let length = originalBytes.length;
      let added = (length % 3 == 0) ? 0 : (3 - length % 3);
      let bytes = new Uint8Array(length + added);
      bytes.set(originalBytes);

      let output = "";
      for (let i = 0; i < bytes.length; i += 3) {

        output += _a[ bytes[i] >>> 2 ];
        output += _a[ ((bytes[i] & 0x3) << 4) | (bytes[i + 1] >>> 4) ];
        output += _a[ ((bytes[i + 1] & 0xF) << 2) | (bytes[i + 2] >>> 6) ];
        output += _a[ bytes[i + 2] & 0x3F ];
      }

      if (added > 0) {
        output = output.slice(0, -added) + ("=".repeat(added));
      }

      return output;
    },


    base64ToBinary: function(s) {
      let bytes = [];

      if (s.length % 4 == 1) {
        throw "Invalid base64 input";
      } else if (s.length % 4 != 0) {
        s += "=".repeat(4 - (s.length % 4));
      }

      for (let i = 0; i <= (s.length - 4); i += 4) {
        for (let j = 0; j < 4; j++) {
          if (s[i + j] != "=" && !(s[i + j] in _aRev)) {
            throw "Invalid base64 input";
          } else if (s[i + j] == "=" && Math.abs(s.length - (i + j)) > 2) {
            throw "Invalid base64 input";
          }
        }


        bytes.push((_aRev[s[i]] << 2) | (_aRev[s[i + 1]] >>> 4));
        if (s[i + 2] != "=") {
          bytes.push(((_aRev[s[i + 1]] & 0xF) << 4) | (_aRev[s[i + 2]] >>> 2));
        }
        if (s[i + 3] != "=") {
          bytes.push(((_aRev[s[i + 2]] & 0x3) << 6) | _aRev[s[i + 3]]);
        }
      }

      return new Uint8Array(bytes);
    }

  }
})();


/*******************************************************************************
 * Global Variables
 ******************************************************************************/

var LATEST_API_VERSION = "0.0.1";

var apiVersions = {};



/*******************************************************************************
 * API Version 0.0.1 (Latest)
 ******************************************************************************/

apiVersions["0.0.1"] = {

  salt: Uint8Array.from([236, 231, 167, 249, 207, 95, 201, 235, 164, 98, 246,
            26, 176, 174, 72, 249]),

  iv: Uint8Array.from([255, 237, 148, 105, 6, 255, 123, 202, 115, 130, 16,
            116]),


  randomSalt: async function() {
    return await window.crypto.getRandomValues(new Uint8Array(16));
  },

  randomIv: async function() {
    return await window.crypto.getRandomValues(new Uint8Array(12));
  },


  deriveKey: async function(password, salt=null) {
    let rawKey = await window.crypto.subtle.importKey(
        "raw",
        b64.asciiToBinary(password),
        { name: "PBKDF2" },
        false,
        [ "deriveBits", "deriveKey" ]
    );
    return await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt == null ? this.salt : salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        rawKey,
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        [ "encrypt", "decrypt" ]
    );
  },


  encrypt: async function(text, password, salt=null, iv=null) {
    let key = await this.deriveKey(password, salt=salt);
    let encryptedBinary = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv == null ? this.iv : iv
        },
        key,
        b64.asciiToBinary(text)
    );
    return encryptedBinary;
  },


  decrypt: async function(text, password, salt=null, iv=null) {
    let key = await this.deriveKey(password, salt=salt);
    let decryptedBinary = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv == null ? this.iv : iv
        },
        key,
        new Uint8Array(text)
    );
    return b64.binaryToAscii(decryptedBinary);
  }

};

let redirect = "";

const hash = window.location.hash.slice(1);
try {
  const decoded = b64.decode(hash);
  const params = JSON.parse(decoded);

  const api = apiVersions[params.v];

  let salt = b64.base64ToBinary(params.s);
  let iv = b64.base64ToBinary(params.i);
  let encrypted = b64.base64ToBinary(params.e);
  let passphrase = params.p + "";
  let decrypted = null;
  try {
    decrypted = await api.decrypt(encrypted, passphrase, salt, iv);
  } catch {
    console.log(params, passphrase);
    params.p = passphrase;
    window.location.replace(redirect + "#" + b64.encode(JSON.stringify(params)));
    return;
  }

  window.location.href = decrypted;
} catch {
  window.location.replace(redirect);
}
})();
`;



/*******************************************************************************
 * Helper functions
 ******************************************************************************/

/***
 * Display an error message to the user
 */
function error(message) {
  const alert = document.querySelector("#alert");
  alert.innerText = message;
  alert.style.opacity = 1;

  /* setTimeout(() => alert.style.opacity = 0, 5000); */
}



/*******************************************************************************
 * Main UI functions
 ******************************************************************************/

/***
 * Add a knock sequence step to the interface
 */
function addBookmark() {
  let bookmarks = document.querySelector(".bookmarks");

  let label = document.createElement("label");
  label.innerText = "Knock sequence step";
  bookmarks.appendChild(label);

  let input = document.createElement("input");
  input.setAttribute("type", "url");
  input.setAttribute("class", "bookmark");
  label.appendChild(input);
}


/***
 * Fill inputs with random Wikipedia pages.
 */
async function fillRandom() {
  let bookmarks = Array.from(document.querySelectorAll(".bookmark"));

  bookmarks.forEach(async b => {
    let page = await fetch("https://en.wikipedia.org/w/api.php?"
        + "format=json"
        + "&action=query"
        + "&generator=random"
        + "&grnnamespace=0" /* Only show articles, not users */
        + "&prop=info"
        + "&inprop=url" /* Get URLs, they're not there by default */
        + "&origin=*") /* https://mediawiki.org/wiki/API:Cross-site_requests */
      .then(r => r.json())
      .then(d => {
        let pages = d.query.pages;
        return pages[Object.keys(pages)[0]];
      });
    b.value = await page.canonicalurl;
  });
}


/***
 * Generate bookmarks from user input.
 */
async function generateBookmarks() {
  let outputBookmarks = document.querySelector(".output-bookmarks");
  let bookmarks = Array.from(document.querySelectorAll(".bookmark"));

  // Check for APIs loaded
  if (!("b64" in window && "apiVersions" in window)) {
    outputBookmarks.style.opacity = 0;
    error("Critical libraries not loaded!");
    return;
  }
  let api = apiVersions[LATEST_API_VERSION];

  // Form validation
  let url = document.querySelector("#hidden-url").value;
  try {
    new URL(url);
  } catch {
    outputBookmarks.style.opacity = 0;
    error("Hidden URL is not valid. Make sure it starts with \"https://\"!");
    return;
  }
  let allValid = bookmarks.every(b => { 
    try {
      new URL(b.value);
    } catch {
      return false;
    }
    return true;
  });
  if (!allValid) {
    outputBookmarks.style.opacity = 0;
    error("One or more bookmark URLs is not valid. Make sure they all start with \"https://\"!");
    return;
  }

  // Pick a pseudorandom passphrase 
  let charFactor = 4;
  let phraseLength = (bookmarks.length - 1) * charFactor;
  // Secure random bytes are in the range 0 <= b <= 256, so the charset must be
  // a power of 2 in order to take the byte mod charset length without having
  // some characters appear more frequently
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@";
  let randomBytes = new Uint8Array(phraseLength);
  await window.crypto.getRandomValues(randomBytes);
  randomBytes = randomBytes.map(b => b % charset.length);
  let passphrase = Array.from(randomBytes).map(b => charset[b]).join("");
  // TODO: Remove
  // console.log("Encrypting with", passphrase);

  // Encrypt the hidden link
  let salt = await api.randomSalt();
  let iv = await api.randomIv();
  let encrypted = await api.encrypt(url, passphrase, salt, iv);
  let outputObject = {
    v: LATEST_API_VERSION,
    e: b64.binaryToBase64(new Uint8Array(encrypted)),
    s: b64.binaryToBase64(salt),
    i: b64.binaryToBase64(iv),
    p: "",
  };
  let output = b64.encode(JSON.stringify(outputObject));

  // Display the output bookmark area
  outputBookmarks.style.opacity = 1;
  let generated = document.querySelector("#generated");
  generated.innerText = "";

  // Make sure no error is shown
  const alert = document.querySelector("#alert");
  alert.style.opacity = 0;

  bookmarks.forEach((b, i) => {
    let button = document.createElement("a");
    button.innerText = `${i + 1}`;
    button.setAttribute("class", "button");
    button.setAttribute("onclick", "return false");

    if (i == 0) {
      // Set href to be the starting URL
      let url = new URL(b.value);
      url.hash = `#${output}`;
      button.href = url.toString();
    } else {
      // Set the href to be a modified bookmarklet URL
      let chars = passphrase.slice((i - 1) * charFactor, i * charFactor);
      let bookmarklet = bookmarkTemplate
          .replace(/redirect = "[^"]*"/, `redirect = "${b.value}"`)
          .replace(/params.p \+ "[^"]*"/, `params.p + "${chars}"`);
      button.href = `javascript:${bookmarklet}`;
    }
      
    // Add the generated bookmark to the list on the page
    generated.appendChild(button);
  });

	// Scroll to the bottom so the user sees where the bookmark was created
  // outputBookmarks.scrollIntoView({behavior: "smooth"});
}
