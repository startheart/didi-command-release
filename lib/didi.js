var fs = require('fs');
//project root
var phone_log_file;
exports.addResouces = function(ret, opt){
    var root = fis.project.getProjectPath();
    var phone_log = phone_log_file = fis.file(root, 'phone_log.js');
    var phone_log_filepath = require.resolve('phone_log');
	var content = fs.readFileSync(phone_log_filepath, 'utf8');
    phone_log.setContent(content);
    //放到
    ret.pkg[phone_log.subpath] = phone_log;
}
exports.insertResouces = function(content , file, opt){

    if(file.isHtmlLike){
    	if(opt.console){
            var uri = phone_log_file.getUrl(false, opt.domain);
	        var code = '<script type="text/javascript" charset="utf-8" src="'+ uri +'"></script>';
	        content = content.replace(/"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(<\/body>|<!--phone_log-->)/ig, function(m, $1){
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