var fs = require('fs');
var path = require('path');
var weinre = require('./weinre.js');
var phone_log_source;

function get_phone_log_source(){
    if(phone_log_source === undefined){
        var phone_log_filepath = require.resolve('phone_log');
        phone_log_source = fs.readFileSync(phone_log_filepath, 'utf8');
    }
    return phone_log_source;
}
exports.insertPhoneLogScript = function(content , file, opt){

    if(file.isHtmlLike){
        if(opt.console){
            // var uri = phone_log_file.getUrl(false, opt.domain);
            var id = 'phone_log_'+ Date.now();
            var code = [];
            code[code.length] = '<script type="text/javascript" charset="utf-8" id="' + id +'" > ';
            code[code.length] = get_phone_log_source();
            code[code.length] = ';!function(){\n var phonelogEl = document.getElementById("' + id + '");';
            code[code.length] = "phonelogEl.parentNode.removeChild(phonelogEl);";
            code[code.length] = '}();</script>';
            code = code.join('\r\n');
            content = content.replace(/"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(<head>|<!--phone_log-->)/ig, function(m, $1){
                if($1){
                    m = code + m;
                }
                return m;
            });
        }
        content = content.replace(/<!--phone_log-->/ig, '');
    }
    return content;

}

exports.insertDidiConsoleScript = function(content , file, opt){

    if(file.isHtmlLike){
        if(opt.didiConsole){
            var hostName = 'sf_wb.di' + 'di' + 'static.com';
            var version = '1.0.7';
            var code = [];
            code[code.length] = '\n<script type="text/javascript" src="http://' + hostName + '/static/wb/didiConsole-' + version + '.min.js"></script>\n';
            code = code.join('\r\n');
            content = content.replace(/"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(<head>|<!--didi-console-->)/ig, function(m, $1){
                if($1){
                    m = code + m;
                }
                return m;
            });
        }
        content = content.replace(/<!--didi-console-->/ig, '');
    }
    return content;

}

/*
* weinre
*
*
*
*/
var useWeinre = false;
var openClientWindow = false;
exports.openClientWindow = function(){
    if( useWeinre && openClientWindow){
        _.open( weinre.get('clientUrl') );
    }
}
exports.startWeinre = function(isOpenClient){
    useWeinre = true;
    openClientWindow = isOpenClient !== 'no';
    weinre.start();
}
exports.insertWeinreScript = function(content , file, opt){

    if(file.isHtmlLike){
        if('weinre' in opt){
            var uri = weinre.get('targetUrl');
            // var code = '<script type="text/javascript" charset="utf-8" src="'+ uri +'"></script>';
            var code = [];
            var weinreConfig = fis.config.get('weinre', {});
            var query = weinreConfig.query,
            localStorage = weinreConfig.localStorage;
            code[code.length] = '<script type="text/javascript" id="weinre_'+ Date.now() +'" charset="utf-8">';
            code[code.length] = '(function() {';
            if(localStorage){
                code[code.length] = 'if(localStorage.getItem("'+ localStorage +'") === null){ return;}';
            }else if(query){
                code[code.length] = 'if(location.search.indexOf("' + query +'") === -1){ return;}';
            }
            code[code.length] = 'var script = \'<\' + \'script src="'+ uri+'"><\/\' + \'script>\'';
            // code[code.length] = 'script.setAttribute("src", "'+uri+'");';
            code[code.length] = 'document.write(script)';
            code[code.length] = '})();';
            code[code.length] = '</script>';
            code = code.join('\r\n');
            content = content.replace(/"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(<head>|<!--weinre-->)/ig, function(m, $1){
                if($1){
                    m = code + m;
                }
                return m;
            });
        }
        content = content.replace(/<!--weinre-->/ig, '');
    }
    return content;

}


exports.insertOmega = function (name, content, file, opt) {

    if (opt.omega && file.isHtmlLike) {

        var title;

        content = content.replace(/.*/g, function (match) {

            if (/<title>(.*?)<\/title>/.test(match)) {
                title = RegExp.$1;
            }

            if (/<!--\s*title\s*:\s*?(\w*)\s*-->/.test(match)) {
                title = RegExp.$1;
            }

            if (/<body.*?>/.test(match)) {

                if (/\$[a-zA-Z]+/.test(title)) {
                    title = '滴' + '滴' + '顺' + '风' + '车';
                }
                var lastVersion = '//web' + 'app.di' + 'di' + 'sta' + 'tic.com/sta' + 'tic/webapp/shi' + 'eld/z/om' + 'ega/ome' + 'ga/latest/om' + 'ega.min.js';

                return match + '\n'
                    + '<script>\n'
                    + 'var Omega = {\n'
                    + '    pageTitle: \'' + title + '\',\n'
                    + '    productName: \'beatles-tracker\',\n'
                    + '    debugMode: false,\n'
                    + '    pageId: \'' + name + '|' + path.basename(file.dirname) + '\'\n'
                    + '};\n'
                    + '</script>\n'
                    + '<script>\n'
                    +   'var website = "' + (fis.config.get('omegaUrl') || lastVersion) + '";\n'
                    +   'document.addEventListener("DOMContentLoaded", function(){\n'
                    +   '    var script = document.createElement("script");\n'
                    +   '    script.src = website;\n'
                    +   '    document.getElementsByTagName("head")[0].appendChild(script);\n'
                    +   '}, false);\n'
                    + '</script>\n';
            }

            return match;
        });
    }

    return content;
};


var _ = {};
_.open = function(path, callback) {
    var child_process = require('child_process');
    fis.log.notice('browse ' + path.yellow.bold + '\n');
    var cmd = fis.util.escapeShellArg(path);
    if(fis.util.isWin()){
        cmd = 'start "" ' + cmd;
    } else {
        if(process.env['XDG_SESSION_COOKIE']){
            cmd = 'xdg-open ' + cmd;
        } else if(process.env['GNOME_DESKTOP_SESSION_ID']){
            cmd = 'gnome-open ' + cmd;
        } else {
            cmd = 'open ' + cmd;
        }
    }
    child_process.exec(cmd, callback);
};
