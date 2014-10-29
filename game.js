;(function() {
  var stop = false;

  var Game = function(canvasId) {

    var canvas = document.getElementById(canvasId);
    var screen = canvas.getContext('2d');
    var gameSize = { x: canvas.width, y: canvas.height };

    canvas.style.backgroundImage="url('cheese.jpg')";
    
    // This will include all the mice
    this.bodies = [];

    var self = this;

    // This function is the animation loop
    var tick = function() {
      self.update();
      self.draw(screen, gameSize);
      if (stop === false) {
        requestAnimationFrame(tick);
      };
    };
    
    // Add all the mice to the game
    for (var i = 0; i < 50; i++) {
      this.bodies.push(new Mouse(i, this, gameSize));
    }
    tick();
  };

  Game.prototype = {
    update: function() {

      // Remove dead mice
      this.bodies = this.bodies.filter(function(b) { return b.health > 0 })

      // Update each mouse's position
      for (var i = 0; i < this.bodies.length; i++) {
        this.bodies[i].update();
      };
    },

    draw: function(screen,  gameSize) {
      // Clear the game
      screen.clearRect(0, 0, gameSize.x, gameSize.y);

      // Draw each mouse
      for (var i = 0; i < this.bodies.length; i++) {
        draw(screen, this.bodies[i])
      };
    },

  };

  var Mouse = function(id, game, gameSize) {

    this.id = id;
    this.game = game;
    this.gameSize = gameSize;
    this.size = { x: 50, y: 50 };

    // Sets random start position
    this.center = {
      x: Math.floor((Math.random() * gameSize.x) + 1),
      y: Math.floor((Math.random() * gameSize.x) + 1)
    };

    this.speed = { x: 0, y: 0 }  // Initial speed
    this.maxSpeed = 1.0;
    this.health = 100;
    this.opponent = null;
  };

  Mouse.prototype = {
    update: function() {

      var self = this;
      this.getClosestOpponent(function(other) {
        // Stop animation loop if only one mouse left
        if (other === null) {
          console.log("Winner is Mouse " + self.id);
          stop = true;
          return;
        }
        // Assign opponent to closest mouse
        self.opponent = other;
      });

      var isHealthy = this.isHealthy();
      var isCloseTo = this.isCloseTo(this.opponent);
      var isRatingHard = this.isRatingHard(this.opponent);

      // RULE 1:
      // IF Opponent is Close
      // AND Health is Good
      // AND Rating is NOT Hard
      // THEN Attac
      var attac = isCloseTo * isHealthy * (1 - isRatingHard);

      // RULE 2:
      // IF Opponent is NOT Close
      // AND Health is Good
      // THEN doNothing
      var doNothing = (1 - isCloseTo) * isHealthy;

      // RULE 3:
      // IF Opponent is Close
      // AND Health is Good
      // AND Rating is NOT Hard
      // THEN Attac
      var flee = isCloseTo * isHealthy * isRatingHard;

      var action = attac     *  3
                 + doNothing *  1   // If equally good to flee and attac, then move against the opponent closely
                 + flee      * -3;

      var directions = this.getDirectionsTo(this.opponent);

      this.setSpeed(directions, action);    // Use the action speed and opponent directions

      if (action > 0 && this.distanceTo(this.opponent) < 40) {
        this.bite(this.opponent);
      }

      this.move();
    },

    move: function() {
      this.center.x += this.speed.x;
      this.center.y += this.speed.y;

      // Make sure mouse is within board
      if (this.center.x < 0) this.center.x = 0;
      if (this.center.y < 0) this.center.y = 0;
      if (this.center.x > this.gameSize.x) this.center.x = this.gameSize.x;
      if (this.center.y > this.gameSize.y) this.center.y = this.gameSize.y;
    },

    setSpeed: function(directions, action) {
      this.speed.x = - (directions.dx * action);
      this.speed.y = - (directions.dy * action);
    },

    getDirectionsTo: function(other) {
      dx = this.center.x - other.center.x;
      dy = this.center.y - other.center.y;
      distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
      directions = {
        dx: dx/distance,
        dy: dy/distance
      }
      return directions;
    },

    isCloseTo: function(other) {
      var distance = this.distanceTo(other);
      if (distance > 500) {
        return 0; 
      } else {
        return 1 - (distance / 500);
      }
    },

    isHealthy: function() {
      return (this.health / 100);
    },

    isRatingHard: function(other) {
      var diff = (this.health - other.health + 50) / 100;
      if (diff < 0) return 1;
      else if (diff > 1) return 0;
      else return (1 - diff);
    },

    distanceTo: function(other) {
      dx = this.center.x - other.center.x;
      dy = this.center.y - other.center.y;
      return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    },

    bite: function(other) {
      if (Math.random() > 0.90) {                // Bite in 5% of ticks
        other.health -= Math.random() * 10;     // Damage 0 - 10
      };
    },

    getClosestOpponent: function(cb) {
      var closestOpponent = null;
      for (var i = 0; i < this.game.bodies.length; i++) {
        if (this.id !== this.game.bodies[i].id) {
          if (closestOpponent === null
              || this.distanceTo(this.game.bodies[i]) < this.distanceTo(closestOpponent)) {
            closestOpponent = this.game.bodies[i];
          }
        };
      };
      cb(closestOpponent);
    }
  };

  var draw = function(screen, body) {

    screen.save()

    screen.translate(body.center.x, body.center.y);
    // Find correct rotation and subtract PI/2 because of source image rotation
    screen.rotate(Math.atan2(body.speed.y, body.speed.x) - (Math.PI / 2))
    screen.drawImage( mouse,
                      -(body.size.x / 2),
                      -(body.size.y / 2),
                      body.size.x,
                      body.size.y);
    
    screen.restore()

    // Paint the square that shows health
    if (body.health > 80) {
      screen.fillStyle = "#00FF00";
    } else if (body.health > 50) {
      screen.fillStyle = "#FFFF00";
    } else if (body.health > 30) {
      screen.fillStyle = "#FF8800";
    } else {
       screen.fillStyle = "#FF0000";
    }

    screen.fillRect(body.center.x - body.size.x / 16,
                    body.center.y - body.size.y / 16,
                    body.size.x / 8,
                    body.size.y / 8);
  
  };

  // This is the first function to be called
  window.onload = function() {
    mouse = new Image();
    // Wait until mouse picture is loaded
    mouse.onload = function () {
      new Game("screen");
    };
    mouse.src = 'mouse.png';
  };

})();