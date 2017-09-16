import createRelease from './createRelease'

process.on('unhandledRejection', err => {
  throw err
})

const {
  CIRCLE_PROJECT_USERNAME: OWNER,
  CIRCLE_PROJECT_REPONAME: REPO,
  GH_TOKEN: TOKEN,
  TAG,
} = process.env

createRelease({
  token: TOKEN,
  owner: OWNER,
  repo: REPO,
  tag: TAG,
  showDiff: file => file.filename !== 'package-lock.json',
})
  .then(url => console.log(`Release ${TAG} published at ${url}`))
  .catch(err => {
    if (err === createRelease.NO_PREVIOUS_RELEASE) {
      console.warn(err)
    } else {
      throw err
    }
  })
