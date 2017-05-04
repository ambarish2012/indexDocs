var fs = require('fs');
var glob = require('glob');
var readline = require('readline');
var stream = require('stream');
var _ = require('underscore');
var async = require('async');
var searchJSON = [];
var filePaths = [];

var SimpleMarkdown = require("simple-markdown");
var mdParse = SimpleMarkdown.defaultBlockParse;

var marked = require('marked');
var renderer = new marked.Renderer();
var he = require('he');
var gbag = null;
var gcounter = 0;

renderer.heading = function (text, level) {
    var heading = _removeExtraWhiteSpace(text);
    var hashTag = heading.replace(/ /g, '-').toLowerCase();
    var link = gbag.data.page_baselink + "/#" + hashTag

    var data = gbag.data;
    for (var property in data) {
        if (data.hasOwnProperty(property) && property.startsWith("page_heading")) {
            if (data[property]) {
            } else {
                data[property] = heading;
                data.page_map[property] = link;
                break;
            }
        }
    }

    for (var property in data) {
        if (data.hasOwnProperty(property) && property.startsWith("page_link")) {
            if (data[property]) {
            } else {
                data[property] = link;
                break;
            }
        }
    }

    return "";
}

renderer.paragraph = function (text) {
    if (text.match(/main_section/g) != null) {
        var arr = text.split(/\r?\n/);
        gbag.data.main_section = arr[0].split(/:/)[1];
        gbag.data.sub_section = arr[1].split(/:/)[1];
    } else {
        gbag.data.page_paragraph += _removeTagsAndExtraWhiteSpace(text);
        gbag.data.page_paragraph += ' ';
    }

    return "";
}

renderer.listitem = function (text) {
    gbag.data.page_listitem += _removeTagsAndExtraWhiteSpace(text);
    gbag.data.page_listitem += ' ';
    return "";
}

renderer.code = function (code, language) {
    gbag.data.page_code += _replaceNewLinesWithSpaces(code);
    gbag.data.page_code += ' ';
    return "";
}

// var contents = "![console-view](https://github.com/devops-recipes/test-api-nouvola/raw/master/runshjob-console-view.png)";
// marked(contents, { renderer: renderer });

//glob("docs/sources/**/*.md", function(err, res) {
glob("*.md", function(err, res) {
    if (err)
        console.log('Error while getting the files');
    filePaths = res;
    async.eachSeries(filePaths,
        function (filePath, callback) {
            var path = filePath;
            var data = {
                page_name: '',
                main_section: '',
                sub_section: '',
                page_heading1: '',
                page_heading2: '',
                page_heading3: '',
                page_heading4: '',
                page_heading5: '',
                page_heading6: '',
                page_heading7: '',
                page_heading8: '',
                page_heading9: '',
                page_heading0: '',
                page_link1: '',
                page_link2: '',
                page_link3: '',
                page_link4: '',
                page_link5: '',
                page_link6: '',
                page_link7: '',
                page_link8: '',
                page_link9: '',
                page_link0: '',
                page_paragraph: '',
                page_listitem: '',
                page_code: '',
                page_baselink: '',
                page_map: new Object()
            };
            data.page_name = path.replace('docs/sources/', '');
            data.page_name = data.page_name.replace('.md', '');
            data.page_baselink = 'http://rcdocs1.shippable.com/' + data.page_name;
            var bag = {
                filePath: filePath,
                data: data
            };
            async.series([
                    _parseFileMD.bind(null, bag)
                ],
                function (err) {
                    if (err)
                        console.log('Error');
                    return callback();
                }
            );
        },
        function (err) {
            if (err)
                console.log('failed');
            var json = JSON.stringify(searchJSON);
            console.log(json);
            fs.writeFile('output.json', json);
        }
    );
});

function _removeTagsAndExtraWhiteSpace(string) {
    var re = /<(?:[^>=]|='[^']*'|="[^"]*"|=[^'"][^\s>]*)*>/gi;
    string = string.replace(re, ' ');
    string = string.replace(/\s\s+/g, ' ');

    return he.decode(_.unescape(string));
}

function _removeExtraWhiteSpace(string) {
    return he.decode(_.unescape(string.replace(/\s\s+/g, ' ')));
}

function _replaceNewLinesWithSpaces(string) {
    return he.decode(_.unescape(string.replace(/[\r\n]+/g," ")));
}

function _parseFileMD(bag, next) {
    fs.readFile(bag.filePath, 'utf8', function(err, contents) {
        // check for empty md file
        var numH1 = (contents.match(/#/g) || []).length;
        if (numH1 > 1) {
            gbag = bag;
            marked(contents, {renderer: renderer});
            searchJSON.push(bag.data);
        }
        return next();
    });
}
