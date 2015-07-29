var fs = require('fs');
var weinre = require('./weinre.js');
//project root
var phone_log_file;
exports.addPhoneLogResouces = function(ret, opt){
    var root = fis.project.getProjectPath();
    var phone_log = phone_log_file = fis.file(root, 'phone_log.js');
    var phone_log_filepath = require.resolve('phone_log');
    var content = fs.readFileSync(phone_log_filepath, 'utf8');
    phone_log.setContent(content);
    //放到
    ret.pkg[phone_log.subpath] = phone_log;
}
exports.insertPhoneLogScript = function(content , file, opt){

    if(file.isHtmlLike){
        if(opt.console){
            var uri = phone_log_file.getUrl(false, opt.domain);
            var code = '<script type="text/javascript" charset="utf-8" src="'+ uri +'"></script>';
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
    openClientWindow = !!isOpenClient;
    weinre.start();
}
exports.insertWeinreScript = function(content , file, opt){

    if(file.isHtmlLike){
        if('weinre' in opt){
            var uri = weinre.get('targetUrl'); 
            // var code = '<script type="text/javascript" charset="utf-8" src="'+ uri +'"></script>';
            var code = [];
            var query = fis.config.get('weinre').query,
            localStorage = fis.config.get('weinre').localStorage;
            code[code.length] = '<script type="text/javascript" id="weinre_'+ Date.now() +'" charset="utf-8">';
            code[code.length] = '(function() {';
            if(localStorage){
                code[code.length] = 'if(localStorage.getItem("'+ localStorage +'") === null){ return;}';
            }else if(query){
                code[code.length] = 'if(location.search.indexOf("' + query +'") === -1){ return;}';
            }
            code[code.length] = 'var script = document.createElement("script")';
            code[code.length] = 'script.setAttribute("src", "'+uri+'");';
            code[code.length] = 'document.getElementsByTagName("body")[0].appendChild(script);';
            code[code.length] = '})();';
            code[code.length] = '</script>';
            code = code.join('\r\n');
            content = content.replace(/"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(<\/body>|<!--weinre-->)/ig, function(m, $1){
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

