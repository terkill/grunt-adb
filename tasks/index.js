/*
 * Task: adb
 * Description: Launch ADB commands from Grunt
 * Dependencies: child_process
 */

module.exports = function(grunt) {
    var cp = require("child_process");
    var terminal = cp.exec;
    var spawn = cp.spawn;

    var run = function(command, callback) {
        terminal(command, function(error, stdout, stderr) {
            var message = command + (error ? ' KO' : ' OK')[error ? 'red' : 'green'];
            grunt.log.writeln(message);
            callback(error);
        });
    }

    grunt.registerMultiTask('adb', 'Launch ADB commands from Grunt', function() {
        var done = this.async();

        // handle emulator / device option, or select the only USB conected device
        if (typeof this.data.emulator !== 'undefined') {
            this.data.device = ' -e ';
        } else if (typeof this.data.device === 'undefined') {
            this.data.device = ' -d ';
        } else {
            this.data.device = ' -s ' + this.data.device;
        }

        // handle debug option, or set by default
        if (typeof this.data.debug === 'undefined' || this.data.debug) {
            this.data.debug = ' -D ';
        } else {
            this.data.debug = ' ';
        }

        // handle wait option, or set by default
        if (typeof this.data.wait === 'undefined' || this.data.wait) {
            this.data.wait = ' -W ';
        } else {
            this.data.wait = ' ';
        }

        // handle action option
        if (!this.data.action) {
            this.data.action = ' -a android.intent.action.MAIN ';
        } else {
            this.data.action = ' -a ' + this.data.action;
        }

        // handle activity option
        if(!this.data.activity) {
            this.data.activity = ''
        } else {
            this.data.activity = '/' + this.data.activity;
        }

        if (!this.data.runner) {
            this.data.runner = 'android.test.InstrumentationTestRunner';
        }


        // UNINSTALL
        if (this.data.uninstall) {
            run('adb ' + this.data.device + ' uninstall ' + this.data.uninstall, function(error){
                done(error);
            });
        }

        // INSTALL
        if (this.data.install) {
            run('adb ' + this.data.device + ' install -r ' + this.data.install, function(error){
                done(error);
            });
        }

        // AM START aka LAUNCH
        if (this.data.launch) {
            run('adb ' + this.data.device + ' shell am start ' + this.data.wait  + this.data.debug + this.data.action + ' ' + this.data.launch + this.data.activity, function(error){
                done(error);
            });
        }
        //
        // AM INSTRUMENT
        if (this.data.instrument) {
            if (this.data.wait === ' -W ') {
                this.data.wait = '-w';
            }

            var args = [
                this.data.device.trim(),
                'shell',
                'am',
                'instrument',
                this.data.wait.trim(),
                this.data.instrument + '/' + this.data.runner]
            grunt.log.write(args);
            var adb = spawn('adb', args);

            var exitCode = 0;
            adb.stdout.on('data', function (data) {
                data = data.toString();
                grunt.log.write(data);
                if (data.indexOf('FAILURES!!!') >= 0) {
                    exitCode = 1;
                }
            });
            adb.stderr.on('data', function (data) {
                data = data.toString();
                grunt.log.error(data);
            });
            adb.on('exit', function (code) {
                done(code === 0 && exitCode === 0);
            });
        }
    });
};
