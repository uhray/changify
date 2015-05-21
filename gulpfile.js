var gulp = require('gulp'),
    child = require('child_process');

// Top Level Commands ----------------------------------------------------------

gulp.task('default', ['info']);
gulp.task('lint', ['dolint']);

// Helper Tasks ----------------------------------------------------------------

gulp.task('info', function() {
  console.log('\nUsage:\t gulp [ lint ]\n');
});

gulp.task('dolint', function() {
  return child.spawn('./node_modules/.bin/jscs', ['./'], { stdio: 'inherit' });
});
