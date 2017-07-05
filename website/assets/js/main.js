"use strict";

function NoteGenerator (options) {
  options = options || {};
  let RANGE_MIN = options.min || 3;
  let RANGE_MAX = options.max || 6;

  const NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const NOTES_SHARP = ['C', 'D', 'F', 'G', 'A'];

  this.getRandomArbitrary = function (min, max) {
    return Math.round(Math.random() * (max - min) + min);
  };

  // F3 -- G6
  this.getNote = function () {
    var range = this.getRandomArbitrary(RANGE_MIN, RANGE_MAX);
    var min = 0, max = 6;

    if (range == 3) {
      min = 5;
    } else if (range == 6) {
      max = 5;
    }

    var note = NOTES[ this.getRandomArbitrary(min, max) ];

    return note + (this.getRandomArbitrary(1, 5) % 4 == 0 && _.includes(NOTES_SHARP, note) ? '#' : '') + range;
  };

  return this;
}

const NOTES_1 = 'C#5/q, B4, A4, G#4, C#5/q, B4, A4, G#4, C#5/q, B4, A4, G#4, C#5/q, B4, A4, G#4';
const NOTES_2 = 'E5/q, D#5, E5, D#5, E5, B4, D5, C5, A4'

function Sheet (options) {
  options = options || {};

  let width = options.width || 1400;
  let height = options.height || 1400;
  let selector = options.selector || 'sheet';

  let currentNoteIndex = 0;
  let sheetNotes = options.notes || 'C#5/q';
  let sheetNotesArray = sheetNotes.split(',').map((note) => note.split('/')[0].trim());

  let playedNotes = [];

  let noteGenerator = new NoteGenerator();

  // Make VexFlow global
  let vf, vfX, vfY;

  this.resetSVG = function () {
    // Clear current html container
    $('#' + selector).html('');

    // reset draw variables
    vfY = 10;
    vfX = 10;
  };

  this.formatCurrentPlayedNote = (playedNoteString) => {
    if (playedNotes.length == 0) {
      return playedNoteString + '/q';
    } else {
      return playedNotes.join(',') + ', ' + playedNoteString;
    }
  };

  this.addPlayedNote = (playedNoteString) => {
    if (playedNotes.length === 0) {
      playedNotes.push(playedNoteString + '/q');
    } else {
      playedNotes.push(playedNoteString);
    }
  };

  this.shouldAdvance = (playedNoteString, strictMode) => {
    if (strictMode) {
      this.addPlayedNote(playedNoteString);
      if (playedNoteString === sheetNotesArray[currentNoteIndex]) {
        currentNoteIndex++;
      }
    } else {
      if (playedNoteString === sheetNotesArray[currentNoteIndex]) {
        currentNoteIndex++;
        this.addPlayedNote(playedNoteString);
      }
    }
  };

  this.tick = (playedNote, options) => {
    options = options || {strick: true};
    playedNote = playedNote.trim().toUpperCase();

    this.draw(playedNote);
    this.shouldAdvance(playedNote, options.strick);
  };


  this.makeSystem = function (width) {
    let system = vf.System({ x: vfX, y: vfY, width: width, spaceBetweenStaves: 10 });
    vfX += width;
    return system;
  };

  this.drawSystem = (notes) => {
    let score = vf.EasyScore();
    let notesChunk = _.chunk(notes, 4);

    notesChunk.forEach((notesGroup, index) => {
      let sys = this.makeSystem(250).addStave({
        voices: [
          score.voice(notesGroup).setStrict(false)
        ]
      });

      // Start of line
      if (index == 0 || index % 4 == 0) sys.addClef('treble').addTimeSignature('4/4');
      // End of line
      if (index != 0 && (index + 1) % 4 == 0 && index != (notesChunk.length - 1)) this.vfNewLine();
    });

    this.vfNewLine();
  };

  this.vfNewLine = function () {
    vfY += 150;
    vfX = 10;
  };

  this.draw = (playedNoteString) => {
    // Clear current SVG
    this.resetSVG();

    vf = new Vex.Flow.Factory({
      renderer: {selector: selector, width: width, height: height}
    });

    let score = vf.EasyScore();

    // What I should play
    let notes = score.notes(sheetNotes, {stem: 'up'});
    this.drawSystem(notes);

    // What I've played
    let playedNote = score.notes(this.formatCurrentPlayedNote(playedNoteString), {stem: 'up'});
    this.drawSystem(playedNote);

    vf.draw();
  };

  this.test = () => {
    this.tick(noteGenerator.getNote());
  };

  // Start the game
  this.tick('');
  playedNotes = [];

  return this;
}


function initVexFlow () {
  window.a = new Sheet({
    notes: NOTES_2
  });
}


$(function() {
  // Init VexFlow
  initVexFlow();

  var socket = io('http://0.0.0.0:3000');

  // socket.on('note unpressed', function (data) {
  // });

  socket.on('note pressed', function(data) {
    console.log(data);
    a.tick(data.note);
  });
});
