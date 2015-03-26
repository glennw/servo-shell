# Servo Shell
A proof of concept web browser interface for Servo, using the [mozbrowser](https://developer.mozilla.org/en-US/docs/Web/API/Using_the_Browser_API) APIs.

## Status

![Example](/screenshots/shell.png)

* Create (and close) tabs.
* Enter URL and hit enter to browse to a site.
* Back / Forward buttons work.
* Window title, tabs, url bars update.
* Loading spinner!
* The JS / CSS is very simplistic, to work around missing APIs and layout bugs that exist in Servo.

## Future Work

* Fix up layout bugs in existing prototype.
* Add more shell functionality (as Servo supports more mozbrowser APIs).
* Switch shell to use react.js when Servo supports it.
* Make the real browser.html work in Servo :)

## How do I use it?

* Clone and build [Servo](https://github.com/servo/servo#the-servo-parallel-browser-project).
    * Make sure you build Servo in release mode - `./mach build --release` - performance will be *much* better!
* Clone this repo.
* `./mach run --release ../servo-shell/index.html -e`
