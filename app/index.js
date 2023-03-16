const simpleGit = require('simple-git');
const git = simpleGit();

function parseTag(tagString) {
  if (typeof tagString === 'string'){
    try {
      const regex = /[0-9]+\.[0-9]+\.[0-9]+/g;
      let foundTags = tagString.match(regex);
      // Since GC server does not allow --sort git option we must sort 
      // tags ourselves
      const sortedTags = foundTags.map( a => a.split('.').map( n => +n+10000 ).join('.') ).sort()
                                  .map( a => a.split('.').map( n => +n-10000 ).join('.') );
      return sortedTags[sortedTags.length - 1];
    } catch(err){
      console.error("Error processing tags: " + err);
      throw err;
    }
  }
  else {
    console.error("tagString was not valid: " + tagString);
    throw "Tags in 'tagString' were not valid " + tagString;
  }
}

function buildJSON(investTag) {
  const defaultTag = '3.8.8';
  let latestTag = '';
  const regex = /[0-9]+\.[0-9]+\.[0-9]+/g;
  let validTag = investTag.match(regex);
  if (validTag !== null){latestTag = investTag;}
  else {latestTag = defaultTag;}
  let arch = 'x64';
  let macExt = 'dmg';
  if (
    Number(latestTag.split('.')[0]) == 3
    && Number(latestTag.split('.')[1]) < 9
  ) {
    arch = 'x86'
    macExt = 'zip'
  }

  const baseUrl = "https://storage.googleapis.com/releases.naturalcapitalproject.org";
  responseJson = {
    "title": "InVEST",
    "nid":"14056",
    "links": [
      {
        "title": `Download InVEST ${latestTag} (Windows) - Workbench`,
        "url": `${baseUrl}/invest/${latestTag}/workbench/invest_${latestTag}_workbench_win32_x64.exe`
      },
      {
        "title": `Download InVEST ${latestTag} (Mac) - Workbench`,
        "url": `${baseUrl}/invest/${latestTag}/workbench/invest_${latestTag}_workbench_darwin_x64.dmg`
      },
      {
        "title": "InVEST User's Guide (English)",
        "url": `${baseUrl}/invest-userguide/latest/en/index.html`
      },
      {
        "title": "Guía de uso de InVEST (Español)",
        "url": `${baseUrl}/invest-userguide/latest/es/index.html`
      },
      {
        "title": "InVEST用户指南 (中国人)",
        "url": `${baseUrl}/invest-userguide/latest/zh/index.html`
      },
      {
        "title": "Older and Development Versions of InVEST",
        "url": "http://releases.naturalcapitalproject.org/?prefix=invest/"
      },
      {
        "title": "Individual Sample Datasets for InVEST",
        "url": `http://releases.naturalcapitalproject.org/?prefix=invest/${latestTag}/data/`
      },
    ]
}
  return responseJson;
}

function failureCallback(error) {
  console.error("Error getting latest InVEST tag: " + error);
}

/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 * 	More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 * 	More info: https://expressjs.com/en/api.html#res
 *
 */
exports.investDownloadLinks = (req, res) => {
  // The google cloud server has a version of 'git' that does not support 
  // --sort
  //var git_options = ["--tags", "--sort=-v:refname", "git@github.com:natcap/invest.git"];
  var git_options = ["--tags", "https://github.com/natcap/invest.git"];

  git.listRemote(git_options)
    .then(resultTags => parseTag(resultTags))
    .then(latestTag => buildJSON(latestTag))
    .then(sendResult => {
      res.header("Content-Type", 'application/json');
      res.send(JSON.stringify(sendResult, null, 4));
    })
    .catch(failureCallback);
};
