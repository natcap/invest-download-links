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

  const baseUrl = "https://storage.googleapis.com/releases.naturalcapitalproject.org";
  responseJson = {
    "title": "InVEST",
    "nid":"14056",
    "links": [
      {
        "title": `Download InVEST ${latestTag} (Windows)`,
        "url": `${baseUrl}/invest/${latestTag}/InVEST_${latestTag}_x64_Setup.exe`
      },
      {
        "title": `Download InVEST ${latestTag} (Mac)`,
        "url": `${baseUrl}/invest/${latestTag}/InVEST-${latestTag}-mac.zip`
      },
      {
        "title": "InVEST User's Guide (online)",
        "url": `${baseUrl}/invest-userguide/latest/index.html`
      },
      {
        "title": "Older and Development Versions of InVEST",
        "url": "http://releases.naturalcapitalproject.org/?prefix=invest/"
      },
      {
        "title": "Individual Sample Datasets for InVEST",
        "url": `http://releases.naturalcapitalproject.org/?prefix=invest/${latestTag}data/`
      },
      {
        "title": "生态系统服务评估与权衡（InVEST）模型（3.2.0 版本）使用手册",
        "url": "https://storage.googleapis.com/invest-users-guides/InVEST%203.2.0%20User's%20Guide_Chinese%20Version_20171008.pdf"
      },
      {
        "title": "InVEST User's Guide (Español)",
        "url": "https://naturalcapitalproject.stanford.edu/sites/g/files/sbiybj9321/f/invest_version_en_espanol_oct_2019.pdf"
      }
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
