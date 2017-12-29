'use strict';

var five = require('johnny-five'),
    board = new five.Board(),
    PORT = 8080,
    WebSocketServer = require('ws').Server,
    request = require('request'),
    networkInterfaces = require('os').networkInterfaces(),
    motors = {},
    led = {},
    webappURL = 'http://10.0.0.5:3000',
    localIP;

var wss = new WebSocketServer({port: PORT});

// board setup
board.on('ready', function() {
  motors = {
    //Omniwheel - Motor configuration
    m1: new five.Motor({
      pins: {
        pwm: 5,
        dir: 2
      },
      invertPWM: true
    }),
    m2: new five.Motor({
      pins: {
        pwm: 6,
        dir: 3
      },
      invertPWM: true
    }),
    m3: new five.Motor({
      pins: {
        pwm: 7,
        dir: 4
      },
      invertPWM: true
    })
  };
  motors.m1.stop();
  motors.m2.stop();
  motors.m3.steop();

  led = new five.Led(13);
});

// ws setup
wss.on('connection', function(ws) {
  ws.on('message', function(data, flags) {
    if(data === 'forward') {
      forward(255);
    } else if(data === 'reverse') {
      reverse(255);
    } else if(data === 'turnRight') {
      turnRight(255);
    } else if(data === 'turnLeft') {
      turnLeft(255);
    } else if(data === 'stop') {
      stop();
    } else if(data === 'blink') {
      blink();
    } else if(data === 'noBlink') {
      noBlink();
    }
  });

  ws.on('close', function() {
    console.log('WebSocket connection closed');
  });

  ws.on('error', function(e) {
    console.log('WebSocket error: %s', e.message);
  });

});

// motor functions
var stop = function() {
  motors.left.stop();
  motors.right.stop();
};

var forward = function(speed) {
  motors.left.forward(speed);
  motors.right.forward(speed);
};

var reverse = function(speed) {
  motors.left.reverse(speed);
  motors.right.reverse(speed);
};

var turnRight = function(speed) {
  motors.left.forward(speed);
  motors.right.reverse(speed);
};

var turnLeft = function(speed) {
  motors.left.reverse(speed);
  motors.right.forward(speed);
};

var blink = function() {
  led.strobe(300);
};

var noBlink = function() {
  led.stop();
};

// send robot location to webapp
if(networkInterfaces.wlan0) {
  localIP = networkInterfaces.wlan0[0].address;
} else {
  // use en0 if on mac while developing
  localIP = networkInterfaces.en0[1].address;
}

console.log('local ip is ws://%s:%s', localIP, PORT);

webappURL += '/locate?local_ip=' + localIP;

request.post(webappURL, function(e, r, body) {
  if (e) {
    return console.error('POST request failed:', e);
  }
});


//----------------------------------------------------
// Omniwheel kinematic
//----------------------------------------------------
var drive = function(x,y) {
  vector = cartesian2Polor(x,y);
  speeds = calculateSpeeds(vector);
  driveMotors(motors, speeds);
}

var driveMotors = function (motors, speeds) {

}

var cartesian2Polor = function(x,y) {
  theta = Math.atan2(x,y);
  r = Math.sqrt(y*y + x*x);
  return (r,theta);
}

var calculateSpeeds = function(r, theta) {
  vx = Math.cos(theta) * r;
  vy = Math.sin(theta) * r;

  w1 = -vx;
  w2 = (0.5 * vx) - (Math.sqrt(3/2) * vy);
  v3 = (0.5 * vx) - (math.sqrt(3/2) * vy);

  return [w1, w2, w3];
}


//------------------------------------------------------
// little helper functions
//------------------------------------------------------
var map = function (x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var clamp = function (num, min, max) {
  //return num <= min ? min : num >= max ? max : num;
  return Math.max(min,Math.min(num,max));
}

var mapRange = function(n) {
  n = Math.ceil((n*255) / 122.4744871391589);

}
