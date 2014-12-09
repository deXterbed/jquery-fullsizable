/*
jQuery fullsizable plugin v2.0.2
  - take full available browser space to show images

(c) 2011-2014 Matthias Schmidt <http://m-schmidt.eu/>

Example Usage:
  $('a.fullsizable').fullsizable();

Options:
  **detach_id** (optional, defaults to null) - id of an element that will temporarely be set to ``display: none`` after the curtain loaded.
  **navigation** (optional, defaults to true) - show next and previous links when working with a set of images.
  **closeButton** (optional, defaults to true) - show a close link.
  **fullscreenButton** (optional, defaults to true) - show full screen button for native HTML5 fullscreen support in supported browsers.
  **openOnClick** (optional, defaults to true) - set to false to disable default behavior which fullsizes an image when clicking on a thumb.
  **clickBehaviour** (optional, 'next' or 'close', defaults to 'close') - whether a click on an opened image should close the viewer or open the next image.
  **preload** (optional, defaults to true) - lookup selector on initialization, set only to false in combination with ``reloadOnOpen: true`` or ``fullsizable:reload`` event.
  **reloadOnOpen** (optional, defaults to false) - lookup selector every time the viewer opens.
*/


(function() {
  var $, $image_holder, bindCurtainEvents, closeFullscreen, closeViewer, container_id, current_image, hasFullscreenSupport, hideChrome, image_holder_id, images, keyPressed, makeFullsizable, mouseMovement, mouseStart, nextImage, openViewer, options, preloadImage, prepareCurtain, prevImage, resizeImage, showChrome, showImage, spinner_class, stored_scroll_position, toggleFullscreen, unbindCurtainEvents;

  $ = jQuery;

  container_id = '#jquery-fullsizable';

  image_holder_id = '#fullsized_image_holder';

  spinner_class = 'fullsized_spinner';

  $image_holder = $('<div id="jquery-fullsizable"><div id="fullsized_image_holder"></div></div>');

  images = [];

  current_image = 0;

  options = null;

  stored_scroll_position = null;

  resizeImage = function() {
    var image, _ref;

    image = images[current_image];
    if ((_ref = image.ratio) == null) {
      image.ratio = (image.naturalHeight / image.naturalWidth).toFixed(2);
    }
    if ($(window).height() / image.ratio > $(window).width()) {
      $(image).width($(window).width());
      $(image).height($(window).width() * image.ratio);
      return $(image).css('margin-top', ($(window).height() - $(image).height()) / 2);
    } else {
      $(image).height($(window).height());
      $(image).width($(window).height() / image.ratio);
      return $(image).css('margin-top', 0);
    }
  };

  keyPressed = function(e) {
    if (e.keyCode === 27) {
      closeViewer();
    }
    if (e.keyCode === 37) {
      prevImage(true);
    }
    if (e.keyCode === 39) {
      return nextImage(true);
    }
  };

  prevImage = function(shouldHideChrome) {
    if (shouldHideChrome == null) {
      shouldHideChrome = false;
    }
    if(current_image == 0) {
      current_image = images.length;
    }
    return showImage(images[current_image - 1], -1, shouldHideChrome);
  };

  nextImage = function(shouldHideChrome) {
    if (shouldHideChrome == null) {
      shouldHideChrome = false;
    }
    if(current_image == images.length - 1) {
      current_image = -1;
    }
    return showImage(images[current_image + 1], 1, shouldHideChrome);
  };

  showImage = function(image, direction, shouldHideChrome) {
    if (direction == null) {
      direction = 1;
    }
    if (shouldHideChrome == null) {
      shouldHideChrome = false;
    }
    current_image = image.index;
    $(image_holder_id).hide();
    $(image_holder_id).html(image);
    if (image.loaded != null) {
      $(container_id).removeClass(spinner_class);
      resizeImage();
      $(image_holder_id).fadeIn('fast');
      return preloadImage(direction);
    } else {
      $(container_id).addClass(spinner_class);
      image.onload = function() {
        resizeImage();
        $(image_holder_id).fadeIn('slow', function() {
          return $(container_id).removeClass(spinner_class);
        });
        this.loaded = true;
        return preloadImage(direction);
      };
      return image.src = image.buffer_src;
    }
  };

  preloadImage = function(direction) {
    var preload_image;

    if (direction === 1 && current_image < images.length - 1) {
      preload_image = images[current_image + 1];
    } else if ((direction === -1 || current_image === (images.length - 1)) && current_image > 0) {
      preload_image = images[current_image - 1];
    } else {
      return;
    }
    preload_image.onload = function() {
      return this.loaded = true;
    };
    if (preload_image.src === '') {
      return preload_image.src = preload_image.buffer_src;
    }
  };

  openViewer = function(image) {
    $('body').append($image_holder);
    $(window).bind('resize', resizeImage);
    showImage(image);
    return $(container_id).hide().fadeIn(function() {
      if (options.detach_id != null) {
        stored_scroll_position = $(window).scrollTop();
        $('#' + options.detach_id).css('display', 'none');
        resizeImage();
      }
      bindCurtainEvents();
      return $(document).trigger('fullsizable:opened');
    });
  };

  closeViewer = function() {
    if (options.detach_id != null) {
      $('#' + options.detach_id).css('display', 'block');
      $(window).scrollTop(stored_scroll_position);
    }
    $(container_id).fadeOut(function() {
      return $image_holder.remove();
    });
    closeFullscreen();
    $(container_id).removeClass(spinner_class);
    unbindCurtainEvents();
    return $(window).unbind('resize', resizeImage);
  };

  makeFullsizable = function() {
    images.length = 0;
    $(options.selector).each(function() {
      var image;

      image = new Image;
      image.buffer_src = $(this).attr('href');
      image.index = images.length;
      images.push(image);
    });
    if (images.length > 0){
      return openViewer(images[0], this);
    }
  };

  prepareCurtain = function() {
    if (options.navigation) {
      if ($image_holder.find("#fullsized_go_prev").length == 0){
        $image_holder.append('<a id="fullsized_go_prev" href="javascript:void(0)"><i class="icon-angle-left"></i></a>');
        $(document).on('click', '#fullsized_go_prev', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return prevImage();
        });
      }
      if ($image_holder.find("#fullsized_go_next").length == 0) {
        $image_holder.append('<a id="fullsized_go_next" href="javascript:void(0)"><i class="icon-angle-right"></i></a>')
        $(document).on('click', '#fullsized_go_next', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return nextImage();
        });
      }
    }
    if (options.closeButton) {
      if ($image_holder.find("#fullsized_close").length == 0) {
        $image_holder.append('<a id="fullsized_close" href="javascript:void(0)"><i class="glyphicon-remove_2"></i></a>');
        $(document).on('click', '#fullsized_close', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return closeViewer();
        });
      }
    }
    if (options.fullscreenButton && hasFullscreenSupport()) {
      if ($image_holder.find("#fullsized_fullscreen").length == 0) {
        $image_holder.append('<a id="fullsized_fullscreen" href="javascript:void(0)"></a>');
        $(document).on('click', '#fullsized_fullscreen', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return toggleFullscreen();
        });
      }
    }
    switch (options.clickBehaviour) {
      case 'close':
        return $(document).on('click', container_id, closeViewer);
      case 'next':
        return $(document).on('click', container_id, function() {
          return nextImage(true);
        });
    }
  };

  bindCurtainEvents = function() {
    $(document).bind('keydown', keyPressed);
    $(document).bind('fullsizable:next', function() {
      return nextImage(true);
    });
    $(document).bind('fullsizable:prev', function() {
      return prevImage(true);
    });
    return $(document).bind('fullsizable:close', closeViewer);
  };

  unbindCurtainEvents = function() {
    $(document).unbind('keydown', keyPressed);
    $(document).unbind('fullsizable:next');
    $(document).unbind('fullsizable:prev');
    $(document).unbind('fullsizable:close');
    $('#fullsized_close').unbind('click');
  };

  hideChrome = function() {
    var $chrome;

    $chrome = $image_holder.find('a');
    if ($chrome.is(':visible') === true) {
      $chrome.toggle(false);
      return $image_holder.bind('mousemove', mouseMovement);
    }
  };

  mouseStart = null;

  mouseMovement = function(event) {
    var distance;

    if (mouseStart === null) {
      mouseStart = [event.clientX, event.clientY];
    }
    distance = Math.round(Math.sqrt(Math.pow(mouseStart[1] - event.clientY, 2) + Math.pow(mouseStart[0] - event.clientX, 2)));
    if (distance >= 10) {
      $image_holder.unbind('mousemove', mouseMovement);
      mouseStart = null;
      return showChrome();
    }
  };

  showChrome = function() {
    $('#fullsized_close, #fullsized_fullscreen').toggle(true);
  };

  $.fn.fullsizable = function(opts) {
    options = $.extend({
      selector: this.selector,
      detach_id: null,
      navigation: true,
      closeButton: true,
      fullscreenButton: false,
      openOnClick: true,
      clickBehaviour: 'next',
      preload: true,
      reloadOnOpen: true
    }, opts || {});
    prepareCurtain();
    if (options.preload) {
      makeFullsizable();
    }
    $(document).bind('fullsizable:reload', makeFullsizable);
    $(document).bind('fullsizable:open', function(e, target) {
      var image, _i, _len, _results;

      if (options.reloadOnOpen) {
        makeFullsizable();
      }
      _results = [];
      for (_i = 0, _len = images.length; _i < _len; _i++) {
        image = images[_i];
        if (image.buffer_src === $(target).attr('href')) {
          _results.push(openViewer(image, target));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
    return this;
  };

  hasFullscreenSupport = function() {
    var fs_dom;

    fs_dom = $image_holder.get(0);
    if (fs_dom.requestFullScreen || fs_dom.webkitRequestFullScreen || fs_dom.mozRequestFullScreen) {
      return true;
    } else {
      return false;
    }
  };

  closeFullscreen = function() {
    return toggleFullscreen(true);
  };

  toggleFullscreen = function(force_close) {
    var fs_dom;

    fs_dom = $image_holder.get(0);
    if (fs_dom.requestFullScreen) {
      if (document.fullScreen || force_close) {
        return document.exitFullScreen();
      } else {
        return fs_dom.requestFullScreen();
      }
    } else if (fs_dom.webkitRequestFullScreen) {
      if (document.webkitIsFullScreen || force_close) {
        return document.webkitCancelFullScreen();
      } else {
        return fs_dom.webkitRequestFullScreen();
      }
    } else if (fs_dom.mozRequestFullScreen) {
      if (document.mozFullScreen || force_close) {
        return document.mozCancelFullScreen();
      } else {
        return fs_dom.mozRequestFullScreen();
      }
    }
  };

}).call(this);