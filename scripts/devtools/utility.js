'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {existsSync, mkdirSync} = require('fs');
const {readJsonSync, writeJsonSync} = require('fs-extra');
const inquirer = require('inquirer');
const {join} = require('path');
const createLogger = require('progress-estimator');
const {
  BUILD_METADATA_TEMP_DIRECTORY,
  NPM_PACKAGES,
} = require('./configuration');

const logger = createLogger({
  storagePath: join(__dirname, '.progress-estimator'),
});

async function checkNPMPermissions() {
  const currentUser = await execRead('npm whoami');
  const failedProjects = [];

  const checkProject = async project => {
    const owners = (await execRead(`npm owner ls ${project}`))
      .split('\n')
      .filter(owner => owner)
      .map(owner => owner.split(' ')[0]);

    if (!owners.includes(currentUser)) {
      failedProjects.push(project);
    }
  };

  await logger(
    Promise.all(NPM_PACKAGES.map(checkProject)),
    `Checking NPM permissions for ${chalk.bold(currentUser)}.`,
    {estimate: 2500}
  );

  console.log('');

  if (failedProjects.length) {
    console.error(chalk.red.bold('Insufficient NPM permissions'));
    console.error('');
    console.error(
      chalk.red(
        `NPM user {underline ${currentUser}} is not an owner for: ${chalk.bold(
          failedProjects.join(', ')
        )}`
      )
    );
    console.error(
      chalk.red(
        'Please contact a React team member to be added to the above project(s).'
      )
    );
    process.exit(1);
  }
}

function clear() {
  console.clear();
}

async function confirm(message, exitFunction) {
  console.log('');

  const {confirmation} = await inquirer.prompt({
    name: 'confirmation',
    type: 'confirm',
    message,
  });

  console.log('');

  if (!confirmation) {
    if (typeof exitFunction === 'function') {
      exitFunction();
