$(function() {
  var socket = io('http://192.168.0.8:3000');

  var RANGE_MIN = 3;
  var RANGE_MAX = 6;

  var NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var NOTES_SHARP = ['C', 'D', 'F', 'G', 'A'];

  var CURRENT_NOTE = {};
  var WAIT_BETWEEN_NOTES = 300; // in ms

  var getRandomArbitrary = function (min, max) {
    return Math.round(Math.random() * (max - min) + min);
  };

  var isOutofLine = function (data) {
    if( data.range === 5 && data.note === 'C') {
      return true;
    }
  };

  var $createNote = function(data) {
    return $('<span id="note" class="current-note round ' + keyNumber(data) + '"></span>')
  };

  var keyNumber = function (data) {
    return data.note + data.range;
  };

  var showNote = function (data, color, classes) {
    var $note = $createNote(data, color);
    $note.css('background-color', color);
    $note.addClass(classes);

    if (data.type === '#') {
      $note.addClass('sharp');
    }

    if ( isOutofLine(data) ) {
      $note.addClass('extra-line');
    }

    $('.sheet-wrapper').append($note);
  };

  var clearAllNotes = function () {
    $("#note").remove();
  };

  // F3 -- G6
  window.generateRandomNote = function () {
    var range = getRandomArbitrary(RANGE_MIN, RANGE_MAX);
    var min = 0, max = 6;

    if (range == 3) {
      min = 5;
    } else if (range == 6) {
      max = 5;
    }

    var note = NOTES[ getRandomArbitrary(min, max) ];

    CURRENT_NOTE = {
      note: note,
      type: getRandomArbitrary(1, 5) % 4 == 0 && _.includes(NOTES_SHARP, note) ? '#' : null,
      range: range
    };

    console.log(CURRENT_NOTE);
    showNote(CURRENT_NOTE, '#000');
  };

  socket.on('note unpressed', function (data) {
    var selector = '.' + keyNumber(data);
    if (data.type === '#') {
      selector += '.sharp';
    } else {
      selector += ':not(.sharp)';
    }

    console.log(selector);

    $(selector).remove();
  });

  socket.on('note pressed', function(data) {
    console.log(data);
    console.log(CURRENT_NOTE);

    if (_.isEqual(data, CURRENT_NOTE)) {
      showNote(data, '#00FF00', 'correct');
      clearAllNotes();

      setTimeout(generateRandomNote, WAIT_BETWEEN_NOTES);
    } else {
      showNote(data, '#FF0000', 'playing');
    }
  });

  generateRandomNote();
});
