var midi = require('midi');
var notes = require('./mapping/notes_translation_en.json');

var NUMBER_OF_NOTES = 12;
var C_OFFSET = 3;
var OFFSET = 1;

var input = new midi.input();

// MIDI

var dataHandler = function (delta, data) {
  console.log(data)
  var noteNumber = data[1];
  var keyIntensity = data[2];

  var notePressed = notes[ noteNumber % NUMBER_OF_NOTES ];

  var keyInfo = {
    note: [notePressed.note, notePressed.type, Math.floor(noteNumber / NUMBER_OF_NOTES) + 1].join('')
  };

  if (keyIntensity > 0) {
    io.emit('note pressed', keyInfo); //[0,12] = 1 ;[13,24] = 2

  } else {
    io.emit('note unpressed', keyInfo);
  }

  console.log(keyInfo);
};


if (input.getPortCount() > 0) {
  console.log('Connection to', input.getPortName(0) + '...');

  input.on('message', dataHandler);
  input.openPort(0);
}

// SOCKET IO
var io = require('socket.io')();

io.on('connection', function(socket){
  console.log('Socket connected');
});

/*setInterval(function() {
  dataHandler(10, [121, 53, 42]);
}, 1000);*/


io.listen(3000);
