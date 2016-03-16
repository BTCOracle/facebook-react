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
