## SlugSurvival

This is a project aims to help new and continuing students with their Slug Life.

## Special Thanks

SlugSurvival's development is not possible without the help and support of (no particular order):

1. My parents
2. Niraj R.
3. Alex H.
4. Ching C.
5. Alex R.
6. Julia Z.
7. Taiki M.
8. Tiffany K.
9. Carol J. (my supervisor)
10. Kate B. (for not killing me when I accidentally DoS the school)
11. Rashimi S.
12. etc (I will update this list...)

## Open API

For anyone who is interested in doing something course watching (e.g. need up to date enrollment data for its Slack bot), you can use my API.

Basic help: `https://tracking.slugsurvival.com/help`

Caveat:

1. API endpoint is not CORS-enabled for domains other than SlugSurvival. Please use it in the backend.
2. Some queries return a very *huge* dataset. Please be careful on your backend when processing the returned JSON.

Examples:

1. Fetch compacted classes for Spring 2017: `https://tracking.slugsurvival.com/fetch/2172/compacted`
2. Fetch hot classes in the last 3600 seconds (1 hours): `https://tracking.slugsurvival.com/fetch/2172/heat/3600`
3. Get the latest enrollment data for CMPS 102: `https://tracking.slugsurvival.com/fetch/2172/60679/latestOne`
4. Get the enrollment data for CMPS 102 in the last 3600 seconds (1 hours): `https://tracking.slugsurvival.com/fetch/2172/60679/3600`

## Functionalities

### Disclaimer

THIS IS STILL A VERY NEW PROJECT. Bugs are expected.

### Improved course selections/planning (faster and more responsive)

(Data source: pisa.ucsc.edu, fetched by [UCSC Courses Fetcher](https://github.com/zllovesuki/ucsc))

1. You can search classes *instantly* based on class code, location, instructor name, and class names
2. Class conflicts are detected *instantly*
3. You can add a classes first, sections later
4. RateMyProfessors scores right where you need it
5. Search classes based on preferences, GE, and many other criteria (coming soon)
6. Click to save your current planner as a picture (experimental)

### Improved academic planning

1. Students can make their 4-year planner with an interactive interface, and have the ability to export their planner directly to a PDF file
2. Predicts class offerings based their historic frequency

### Class opening tracker (beta)

1. Subscribe to class entrollment opening status in (near) real-time. Inspired by our fellow slug [Brad Bernard's project: SlugWatch](https://slugwatch.com)
2. This functionality requires `ucsc-watcher` library (which are currently not open source due to its instability and potential DoS when malfunctioning)
3. This functionality requires `notify` library (which are currently not open source due to its instability)

### Enrollment data graph

1. See changes to course enrollment on a time-series graph

### Major/minor requirement in a graph (pending indefinitely)

*CS HELP NEEDED CONTACT ME IF YOU CAN*

1. You no longer have to plow through countless pages of UCSC websites to find your requirements. All courses pre-req and major/minor-req will be visualized in a graph

### Many more to come

## Contributing

Clone the repo, then,
```
npm install && npm install pm2 -g
```

Then,
```
pm2 start app.json --env dev
```

Then,
```
npm run watch
```

Entry file is `src/main.js`.

## Bugs and PR

You know where to go.
