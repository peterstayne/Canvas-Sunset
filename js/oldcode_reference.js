String.prototype.linkify_tweet = function() {
   var tweet;
   tweet = this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+/, function(url) {
		return url.link(url);
	});
   tweet = tweet.replace(/(^|\s)@(\w+)/g, "$1<a href=\"http://www.twitter.com/$2\" target=\'_blank\'>@$2</a>");
   return tweet.replace(/(^|\s)#(\w+)/g, "$1<a href=\"http://search.twitter.com/search?q=%23$2\" target=\'_blank\'>#$2</a>");
};

function updateItemsRight() {
   var getItems = eval( '(' + $.ajax({
       url: "ajax/newpm_ajax.php?types=twitter,googlereader&count=40",
       async: false,
       dataType: "json"
   }).responseText + ')');
   var returnhtml = '';
   for (var i in getItems) {
       switch (getItems[i].type) {
       case 'twitter':
          returnhtml += '<div id=\'pmitem-' + i + '\' class=\'pmitem horizontal tweet\'>';
          returnhtml += '<a href=\'http://twitter.com/pmilkman/status/' + getItems[i].tweetid + '\' target=\'_blank\'>\n';
          returnhtml += '<img src=\'images/siteicons/twitter.png\' class=\'pmitem-image\' />';
          returnhtml += '</a>\n';
          returnhtml += '<p class=\'itemdate\'>' + getItems[i].friendlydate + '</p>';
          returnhtml += '<p class=\'itemcontent\'>' + getItems[i].text.linkify_tweet() + '</p>';
          returnhtml += '</div>\n';
          break;
       case 'googlereader':
          returnhtml += '<div id=\'pmitem-' + i + '\' class=\'pmitem horizontal googlereader\'>';
          returnhtml += '<a href=\'' + getItems[i].readerurl + '\' target=\'_blank\'>\n';
          returnhtml += '<img src=\'http://www.google.com/s2/favicons?domain=www.google.com\' class=\'pmitem-image\' />';
          returnhtml += '</a>\n';
          returnhtml += '<p class=\'itemdate\'>' + getItems[i].friendlydate + '</p>';
          returnhtml += '<p class=\'itemcontent\'>' + getItems[i].comment.linkify_tweet() + '</p>';
          returnhtml += '<p class=\'itemurl\'><a href=\'' + getItems[i].readerurl + '\' target=\'_blank\'>\n';
          returnhtml += getItems[i].title;
          returnhtml += '</a></p>\n';
          returnhtml += '</div>\n';
          break;
       }
   }
   return returnhtml;
}

function updateItemsBottom() {
   var getItems = eval( '(' + $.ajax({
       url: "ajax/newpm_ajax.php?types=flickr&count=8&sortby=rand",
       async: false,
       dataType: "json"
   }).responseText + ')');
   var returnhtml = '';
   for (var i in getItems) {
       switch (getItems[i].type) {
       case 'flickr':
          returnhtml += '<div id=\'pmitem-' + i + '\' class=\'pmitem box flickr\'>';
          returnhtml += '<a href=\'javascript://\' class=\'flickr-load\'>\n';
          returnhtml += '<img src=\'images/siteicons/flickr.png\' class=\'pmitem-image\' />';
          returnhtml += '</a>\n';
          returnhtml += '<img src=\'' + getItems[i].thumburl + '\' class=\'flickr-image\' />';
          returnhtml += '<input type=\'hidden\' value=\'' + getItems[i].largeurl + '\' />';
          returnhtml += '</div>\n';
          break;
       }
   }
   return returnhtml;
}