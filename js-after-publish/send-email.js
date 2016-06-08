function process(request) {

    var console = require("console");
    var xhr = require('xhr');
    
    try {
        
        var x = xhr.post("https://api.sendgrid.com/api/mail.send.json", {
            'query-params': {
                api_user: 'your_user',
                api_key: 'your_pass',
                from: 'text@example.com',
                to: request.message.to,
                toname: request.message.toname,
                subject: request.message.subject,
                text: request.message.text + '\n\nInput:\n' + JSON.stringify(request.message, null, 2)
            }
        });
        
        console.log(x);
        
        return null;
    }
    catch (e) {
        console.error("Uncaught exception:", e);
    }
}