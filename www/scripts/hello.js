/*
 * chat 1.0.0
 * Quanta 2016-04-23
 * 参照了Wayou大神的Hichat。
 */
 var helloDefault = {
 	'colorDefault':'green',
 	'emojiLength':0,
 	'dateReg':/\[date:(\w|:|-)+\]/g,
 	'emojiReg':/\[emoji:\d+\]/g
 }
 $(function(){

 	var chat = new QChat();
 	chat._initialEmoji();
    chat.init();
    $('#color').addClass(helloDefault.colorDefault).data('color',helloDefault.colorDefault);
    $('#color').on('click',function(){
    	$('#colorPanel').modal('show');
    });
    $('#emoji').on('click',function(){
    	$('#emojiPanel').modal('show');
    });
    $('#colorPanel .card').on('click',function(){
    	var color = this.className.split(' ')[0];
    	var text = $(this).find('.message').eq(0).text();
    	var i = $('#color').children();
    	$('#color').removeClass().addClass('ui labeled icon button '+color).data('color',color).text(text).prepend(i);
    	$('#colorPanel').modal('hide');
    	document.getElementById('typeArea').focus();
    	setTimeout(function(){
    		document.getElementById('typeArea').focus();
    	}, 1000);
    });
 });
window.onload = function() {
    
};
var QChat = function() {
    this.socket = null;
};
QChat.prototype = {
    init: function() {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
        	$('#login .message').removeClass().addClass('ui success message').children().text('大侠，请问尊姓大名？');
            $('#login').modal('show');
        });
        this.socket.on('nickExisted', function() {
        	$('#login').modal('show');
        	$('#login .message').removeClass().addClass('ui warning message').children().text('逮，此人正在本小店喝酒，莫非你是冒牌货，速速报上真名！');
        });
        this.socket.on('loginSuccess', function() {
        	$('#login').modal('hide');
            document.title = document.title +' | ' + document.getElementById('nickName').value;
            document.getElementById('typeArea').focus();
        });
        this.socket.on('error', function(err) {
        	$('#login').modal('show');
            if (document.getElementById('login').style.display == 'none') {
                document.getElementById('status').textContent = '!fail to connect :(';
            } else {
                $('#login .message').removeClass().addClass('ui warning message').children().text('抱歉，今天心情好，我们早下班了.....');
            }
        });
        this.socket.on('system', function(nickName, userCount, type) {
            that._displaySysMsg(nickName, (type == 'login' ? ' joined' : ' left'));
            $('#peopleNo').text(userCount);
        });
        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('newImg', function(user, img, color) {
            that._displayImage(user, img, color);
        });
        $('#nickName').on('keyup',function(e){
        	if (e.keyCode == 13) {
                var nickName = this.value.trim();
                if (nickName.length != 0) {
                    that.socket.emit('login', nickName);
                	$('#hdnMyName').val(nickName);
                };
            };
        }).next().on('click',function(){
        	var nickName = $('#nickName').val().trim();
                if (nickName.length != 0) {
                    that.socket.emit('login', nickName);
                	$('#hdnMyName').val(nickName);
                };
        });
        $('#send').on('click',function(){
        	var messageInput = $('#typeArea'),
                msg = messageInput.val(),
                color = $('#color').data('color');
            messageInput.val("");
            messageInput.focus();
            if (msg.trim().length != 0) {
                that.socket.emit('postMsg', msg, color);
                msg += '[date:' + (new Date().toTimeString().substr(0, 8)) + ']';
                that._displayNewMsg($('#hdnMyName').val(), msg, color,true);
                return;
            };
        });
    },
    _initialEmoji: function() {
        var emojiContainer = $('#emojiPanel').find('.column.grid').eq(0);
        for (var i = 69; i > 0; i--) {
        	var src = '/content/emoji/' + i + '.gif';
            var emojiItem = $('<div class="column" style="vertical-align: middle;"><img title="'+i+'" src="'+src+'" /></div>');
            emojiItem.on('click',function(){
            	$('#emojiPanel').modal('hide');
            	var typeArea = $('#typeArea');
            	var typeAreaTemp = typeArea.val();
            	typeArea.val('[emoji:' + $(this).children().attr('title') + ']');
            	$('#send').click();
            	typeArea.val(typeAreaTemp);
            	typeArea.focus();
            	setTimeout(function(){
            		document.getElementById('typeArea').focus();
            	}, 1000);
            	
            });
            emojiContainer.append(emojiItem);
        };
    },
    _showDate: function(msg){
    	var date,match, result = [],
            reg = helloDefault.dateReg;
        while (match = reg.exec(msg)) {
        	result[0] = '<span class="date">' + match[0].slice(6,match[0].length - 1) + '</span>';
            result[1] = msg.replace(match[0],'');
        };
        return result;
    },
    _displayNewMsg: function(user, msg, color,isMyself) {
    	console.info(user);
    	console.info(msg);
        var container = $('#historyMsg'),
            comment = $('<div class="comment"></div>'),
            avatar = $('<a class="avatar"><img src="/images/avatar/elliot.jpg" /></a>'),
            infos = $('<div class="content"></div>'),
            nick = $('<a class="author"></a>'),
            dateObj = $('<div class="metadata"></div>'),
            textObj = $('<div class="text"></div>'),
            msg = this._showEmoji(msg);
            console.info(msg);
        var dateResults = this._showDate(msg);
            console.info(dateResults);
            msg = dateResults[1];
        if(isMyself){
        	comment = $('<div class="comment comment-right"></div>');
        }
        if(/^<img src="(\w|\/|\.){1,}" \/>$/.test(msg)){
        	textObj.html(msg);
        }else{
        	var text = $('<div class="ui '+color+' message"></div>')
        	textObj.append(text.text(msg));
        }
        comment.append(avatar).append(infos.append(dateObj.append(dateResults[0])).append(user).append(textObj));
        container.append(comment);
        container.parent().scrollTop(container.height());
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.parent().scrollTop(container.height());
    },
    _displaySysMsg: function(user, type) {
        var container = $('#historyMsg'),
            joined = $('<div class="ui message helloCenter"></div>'),
            left = $('<div class="ui warning message"></div>'),
            header = $('<div class="header"></div>');
        if(type == 'left'){
            var text = user + ' -> 离开了m(T_T)m     在:' + (new Date().toTimeString().substr(0, 8));
			container.append(left.append(header.text(text)));
        }else{
        	var text = user + ' -> 加入了w(@_@)w     在:' + (new Date().toTimeString().substr(0, 8));
        	container.append(joined.append(header.text(text)));
        }
        container.parent().scrollTop(container.height());
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = helloDefault.emojiReg,
            emojiIndex;
        if(helloDefault.emojiLength == 0){
        	helloDefault.emojiLength = $('#emojiPanel img').length;
        }
        var totalEmojiNum = helloDefault.emojiLength;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img src="/content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};
