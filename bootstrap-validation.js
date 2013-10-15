/* =========================================================
 * bootstrap-validation.js 
 * Original Idea: http:/www.newkou.org (Copyright 2012 Stefan Petre)
 * Updated by 不会飞的羊 (https://github.com/FateSheep/Validation-for-Bootstrap)
 * Updated by zivyuan (https://github.com/zivyuan/Validation-for-Bootstrap)
 * =========================================================
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */
!function($) {
	$.fn.validation = function(options) {
		return this.each(function() {
			$(this).data('_vopt', $.extend({}, $.fn.validation.defaults, options));
			validationForm( $(this) );
		});
	};

	$.fn.validation.defaults = {
		validRules : [
			// 预处理
			{name: 'trim', validate: function(value, ele) {ele.val( $.trim(value) ); return false;}, defaultMsg: ''},
			//
			{name: 'required', validate: function(value) {return ($.trim(value) == '');}, defaultMsg: '请输入内容。'},
			{name: 'confirm', validate: function(value, ele, conf, rule) {
				// TODO::选择器需要优化
				var form = null, conf = conf.substr(1);
				if(conf == null || conf == '') return alert('confirm 字段没有定义');
				do{
					form = form === null ? ele.parent() : form.parent();
				}while( form && form.get(0).nodeName != 'form' );
				var confirm = $.trim( $('input[name="'+conf+'"], select[name="'+conf+'"]', form).val() );
				return value != confirm;
			}, defaultMsg: '确认内容不匹配。'},
			{name: 'number', validate: function(value) {return (!/^[0-9]\d*$/.test(value));}, defaultMsg: '请输入数字。'},
			{name: 'mail', validate: function(value) {return (!/^[a-zA-Z0-9]{1}([\._a-zA-Z0-9-]+)(\.[_a-zA-Z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+){1,3}$/.test(value));}, defaultMsg: '请输入邮箱地址。'},
			{name: 'char', validate: function(value) {return (!/^[a-z\_\-A-Z]*$/.test(value));}, defaultMsg: '请输入英文字符。'},
			{name: 'chinese', validate: function(value) {return (!/^[\u4e00-\u9fff]$/.test(value));}, defaultMsg: '请输入汉字。'},
			// 最小长度  minlen:3
			{name: 'minlen', validate: function(value, ele, conf, rule) {
				var len = parseInt( conf.substr(1) );
				var val = value.length < len;
				_formatMessage('minlen', [len], rule);
				return val;
			}, defaultMsg: '最小长度为 %s 个字符。'},
			// 最大长度  minlen:3
			{name: 'maxlen', validate: function(value, ele, conf, rule) {
				var len = parseInt( conf.substr(1) );
				var val = value.length > len;
				_formatMessage('maxlen', [len], rule);
				return val;
			}, defaultMsg: '最大长度为 %s 个字符。'},
			{name: 'len', validate: function(value, ele, conf, rule) {
				var len = parseInt( conf.substr(1) );
				var val = value.length != len;
				_formatMessage('maxlen', [len], rule);
				return val;
			}, defaultMsg: '长度必须为 %s 个字符。'}
		]
	};

	var formState = false, fieldState = false, wFocus = false;

	var _formatMessage = function (key, vals, rule){
		if( !rule )	return;
		if( !rule.msgTemp ) rule.msgTemp = rule.defaultMsg;
		var msg = rule.msgTemp;
		if(vals && vals.length > 0){
			for(var i=0;i<vals.length;i++){
				msg = msg.replace(/%s/, vals[i]);
			}
		}
		rule.defaultMsg = msg;
	};

	var validateField = function(field, valid, rules) { // 验证字段
		var el = $(field), error = false, errorMsg = '';
		for (i = 0; i < valid.length; i++) {
			var x = true, flag = valid[i], msg = (el.attr(flag + '-message')==undefined)?null:el.attr(flag + '-message');;
			if (flag.substr(0, 1) == '!') {
				x = false;
				flag = flag.substr(1, flag.length - 1);
			}
			var conf = flag.replace(/^[\w\-]+/i, '');
			flag = flag.replace(/^([\w\-]+).*/i, '$1');
			for (j = 0; j < rules.length; j++) {
				var rule = rules[j];
				if (flag == rule.name) {
					// 调用验证方法，3个参数
					// function (值， 对象， 参数)
					if (rule.validate.call(field, el.val(), el, conf, rule) == x) {
						error = true;
						errorMsg = (msg == null)?rule.defaultMsg:msg;
					}
					break;
				}
			}

			if (error) {break;}
		}

		var controls = el.parents('.controls'), controlGroup = el.parents('.control-group'), errorEl = controls.children('.help-block, .help-inline');

		if (error) {
			if (!controlGroup.hasClass('error')) {
				if (errorEl.length > 0) {
					var help = errorEl.text();
					controls.data('help-message', help);
					errorEl.text(errorMsg);
				} else {
					controls.append('<span class="help-inline">'+errorMsg+'</span>');
				}
				controlGroup.addClass('error');
			}
		} else {
			if (fieldState) {
				if (errorEl.length > 0) {
					var help = controls.data('help-message');
					if (help == undefined) {
						errorEl.remove();
					} else {
						errorEl.text(help);
					}
				}
				controlGroup.attr('class','control-group');
			} else {
				if (errorEl.length > 0) {
					var help = errorEl.text();
					controls.data('help-message', help);
				}
			}
		}
		return !error;
	};

	var validationForm = function(obj) { // 表单验证方法
		$(obj).submit(function() { // 提交时验证
			var globalOptions = obj.data('_vopt');
			if (formState) { // 重复提交则返回
				if (globalOptions.onRepeat) {
					globalOptions.onRepeat();
				}
				return false;
			}
			formState = true;
			var validationError = false;
			$('input, textarea', this).each(function () {
				var el = $(this), valid = (el.attr('data-valid')==undefined)?null:el.attr('data-valid').split(' ');
				if (valid != null && valid.length > 0) {
					if (!validateField(this, valid, globalOptions)) {
						if (wFocus == false) {
							scrollTo(0, el[0].offsetTop - 50);
							wFocus = true;
						}

						validationError = true;
					}
				}
			});

			wFocus = false;
			fieldState = true;

			if (validationError) {
				formState = false; 

				$('input, textarea').each(function() {
					var el = $(this), valid = (el.attr('data-valid')==undefined)?null:el.attr('data-valid').split(' ');
					if (valid != null && valid.length > 0) {
						el.focus(function() { // 获取焦点时
							var controls = el.parents('.controls'), controlGroup = el.parents('.control-group'), errorEl = controls.children('.help-block, .help-inline');
							if (errorEl.length > 0) {
								var help = controls.data('help-message');
								if (help == undefined) {
									errorEl.remove();
								} else {
									errorEl.text(help);
								}
							}
							controlGroup.attr('class','control-group');
						});

						el.blur(function() { // 失去焦点时
							validateField(this, valid, globalOptions);
						});
					}
				});
				
				if(globalOptions.onFaile)
					globalOptions.onFaile();
				return false;
			}

			// ajax 情况下需要设置提交状态
			formState = false;
			// 如果定义了 onSuccess 方法并且方法返回 true 时才执行默认动作，否则放弃默认动作
			return globalOptions.onSuccess && globalOptions.onSuccess() === true ? true : false;
		});


	};
}(window.jQuery);
