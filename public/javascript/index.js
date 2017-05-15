/**
 * 页面中部分工具的定义和初始化
 */
// socket.io配置
var socket = io("http://192.168.1.105:3000");
// 当前用户账号
var userName = $("#user-name").data("name");
/**
 * 页面初始化
 */
$(function(){
	// 初始化好友列表
	freshFriendList();

	// 修改个人登录信息
	socket.emit("init", userName);
	// 服务器公告
	socket.on("announcement", function(event){
		if(event == "freshFriendList"){
			freshFriendList();
		}
	});
});
/**
 * 部分组件栏的事件
 */
$(function(){
	// 点击背景关闭模态框
	$(".modal-background").click(function(event) {
		$(this).parent().hide();
	});
	// 导航栏按钮效果
	$("#menu-nav-message").click(function(){
		$(".menu-nav-item").removeClass('menu-nav-item-check');
		$(this).addClass("menu-nav-item-check");
		$("#menu-message").show();
		$("#menu-friend").hide();
	});
	$("#menu-nav-friend").click(function(){
		$(".menu-nav-item").removeClass('menu-nav-item-check');
		$(this).addClass("menu-nav-item-check");
		$("#menu-message").hide();
		$("#menu-friend").show();
	});
	// 关闭下拉栏
	$("body").click(function(){
		var $dropdownMenuBody = $("#dropdown-menu-body");
		if($dropdownMenuBody.is(":visible"))
			$dropdownMenuBody.hide();
	});
});


/**
 * 个人信息处理模块
 */

/**
 * 获取当前用户信息，并将其填入html对应位置
 * 无返回值
 */
function getUserInfo(){
	$.ajax({
		url: "/user/getUserInfo",
		method: "get",
		dataType: "json",
		success: function(data){
			// 将信息填入菜单栏
			$("#user-avatar").attr("src", data.data.avatar);
			$("#user-name").text(data.data.nickName);
			// 将信息填入修改个人信息模态框
			$("#info-change-img").attr("src", data.data.avatar);
			$("#info-change-img-input").val("");
			$("#info-change-nickname").val(data.data.nickName);
			$("#info-change-password").val(data.data.password);
			$("#info-change-email").val(data.data.email);
		},
		error: function(error){
			console.log(error);
		}
	});
}
$(function(){
	// 点击图片修改个人头像
	$("#info-change-img").click(function(){
		$("#info-change-img-input").click();
	});
	// 上传图片预览
	$("#info-change-img-input").change(function(event){
		if(this.files.length){
			var file = this.files[0];
			var reader = new FileReader();
			if(!/image\/\w+/.test(file.type)){
				alert("请选择图片作为头像！");
				return false;
			}
			reader.onload = function(event){
				$("#info-change-img").attr("src", event.target.result);
			}
			reader.readAsDataURL(file);
		}
	});
	// 检查昵称是否已存在
	$(".info-change-submit").blur(function(){
		var $this = $("#info-change-nickname");
        $.ajax({
            method: "GET",
            url: "/user/checkNickName",
            data: {nickName: $this.val()},
            dataType: "json",
            success: function(data){
                if(data.result == "success"){
                    $this.data("result", true);
                }else{
                    $this.data("result", false);
                }
            },
            error: function(err){
            	console.log(err);
                alert("网络异常，检查昵称失败");
            }
        });
	});
	// 修改个人信息
	$("#info-change-form").submit(function(event){
		event.preventDefault();
		if(!$("#info-change-nickname").val()){
			alert("请输入昵称");
			return false;
		}
		if(!$("#info-change-password").val()){
			alert("请输入密码");
			return false;
		}
		if(!$("#info-change-nickname").data("result")){
			alert("昵称已存在");
			$("#info-change-nickname").val($("#user-name").text());
			return false;
		}
		var formData = new FormData(this);
		$.ajax({
			url: "/user/changeUserInfo",
			method: "post",
			data: formData,
			dataType: "json",
			processData: false,
			contentType: false,
			success: function(data){
				$("#modal-info-change").hide();
				getUserInfo();
				alert("修改个人信息成功");
			},
			error: function(error){
				console.log(error);
				$("#modal-info-change").hide();
			}
		});
	});

	// 隐藏菜单栏#dropdown-menu开启，及其下属单位点击事件
	$("#dropdown-menu").click(function(event){
		$("#dropdown-menu-body").show();
		event.stopPropagation();
	});
	$("#change-info").click(function(){
		$("#modal-info-change").show();
	});
	$("#login-out").click(function(){
		location.href = "/loginOut";
	})
});

/**
 * 好友管理模块
 */

/**
 * 刷新好友列表
 */
function freshFriendList() {
	$.ajax({
		url: "/friend/getFriends",
		method: "get",
		dataType: "json",
		success: function(data){
			if(!data.length)
				return false;
			else{
				var html = "";
				data.forEach(function(item){
					html += '<li class="menu-item clearfix" data-name=' + item.name + ' data-status=' + item.status +'><img class="menu-item-avatar" src="' + item.avatar + '"><p class="menu-item-name">' + item.nickName + '</p><p class="menu-item-status">' + (item.status == "up" ? "在线" : "离线") + '</p></li>';
					$("#friend-list").html("").append(html);
				});
			}
		},
		error: function(err){
			console.log(err);
		}
	});
}
$(function(){
	// 点击添加按钮打开搜索模态框
	$("#menu-nav-add").click(function(){
		$("#modal-friend-add").show();
	});
	var $searchInput = $("#search-input");
	// 搜索模态框导航点击事件
	$(".friend-add-btn").click(function(event){
		event.preventDefault();
		$(".friend-add-btn").removeClass("friend-add-btn-check");
		$(this).addClass('friend-add-btn-check');
		$searchInput.data("type", $(this).attr("href"));
	});
	// 添加好友状态下点击#search-btn按钮
	$("#search-btn").click(function(){
		if(!$searchInput.val()){
			alert("请输入查找对象名称");
			return false;
		}
		if($searchInput.data("type") == "friend"){
			$.ajax({
				url: "/friend/searchFriend",
				method: "get",
				dataType: "json",
				data: {
					nickName: $searchInput.val()
				},
				success: function(data){
					if(data.result == "fail"){
						$("#search-result").html("").append('<p class="search-fail">' + data.message + '</p>');
					}
					else{
						$("#search-result").data("name", data.name).html("").append('<img class="result-avatar" src="' + data.avatar + '"><p class="search-name">' + data.nickName + '</p><p class="search-name">' + (data.status == "up" ? "在线" : "离线") + '</p><a class="btn-search-add" id="btn-search-add" href="javascript:;" title="添加" data-status=' + data.status + ' data-targetname=' + data.name + '></a>');
					}
				},
				error: function(err){
					console.log(err);
					alert("网络错误，请稍候重试")
				}
			});
		}
	});
	// 搜索结果下的添加按钮的点击事件
	$("#search-result").on("click", "#btn-search-add", function(){
		var $this = $(this);
		alert("已向对方发送好友请求，请等待对方接受。");
		$("#modal-friend-add").hide();
		if($this.data("status") == "up"){
			// 若对方在线，即时发送添加好友请求
			socket.emit("addFriend", userName, $this.data("targetname"));
		}
		else{

		}
	});
	/**
	 * 接受实时好友添加
	 * @param  {[Object]} from  	好友添加发起方信息，包含name和nickName
	 */
	socket.on("addFriend", function(from){
		addAnnouncement("好友请求", function(){
			var result = confirm("用户" + from.nickName + "希望添加您为好友，是否同意？");
			if(result){
				socket.emit("confirmAddFriend", from.name, userName);
			}
		});
	});
	// 选中朋友进行聊天
	$("#friend-list").on("click", ".menu-item", function(){
		var $this = $(this);
		if(!normalChatList[$this.data("name")]){
			addNormalChat({
				name: $this.data("name"),
				nickName: $this.find(".menu-item-name").text(),
				avatar: $this.find(".menu-item-avatar").attr("src"),
				status: $this.data("status")
			}, "private");
		}
		normalChatList[$this.data("name")].click();
		$("#menu-nav-message").click();
	});
});

/**
 * 消息模块
 */

/**
 * 添加公告消息
 * message为公告的消息内容
 * callback为点击公告后执行的函数
 */
function addAnnouncement(message, callback) {
	var html = '<li class="menu-item clearfix menu-message-check menu-message-new"><img class="menu-item-avatar" src="image/announcement.png"><p class="menu-item-name">' + message + '</p><div class="new-message"></div></li>';
	var item = $(html);
	item.on("click", function(){
		callback();
		$(this).remove();
	});
	$("#menu-message").prepend(item);
}
// 已加入的普通消息数组
var normalChatList = [];
/**
 * 添加常用消息，包括群聊和私聊
 * target对象为聊天对象信息
 * targetType为String，分为group群聊和private私聊两种形式
 */
function addNormalChat(target, targetType){
	if(targetType == "private"){
		var html = '<li class="menu-item clearfix menu-message-new"><img class="menu-item-avatar" src="' + target.avatar + '"><p class="menu-item-name">' + target.nickName + '</p><div class="new-message"></div></li>';
		var item = $(html).data("name", target.name).data("status", target.status);
		item.on("click", function(){
			$("#menu-message > .menu-item").removeClass('menu-message-check');
			$(this).addClass("menu-message-check").removeClass('menu-message-new');
			$("#chat-nickname").text(target.nickName);
			$("#chat-message").html("");
			$("#chat-textarea").data("name", target.name).data("status", target.status);
			// 获取聊天信息并插入展示区域，待补充
			
		});
	}
	else if(targetType == "group"){
		var html = '<li class="menu-item clearfix menu-message-check menu-message-new"><i class="group-avatar"></i><p class="menu-item-name">' + target.name + '</p><div class="new-message"></div></li>';
		var item = $(html).data("name", target.name).data("status", target.status);
	}
	$("#menu-message").prepend(item);
	normalChatList[item.data("name")] = item;
}
$(function(){

});
