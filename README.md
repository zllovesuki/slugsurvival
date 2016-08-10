## SlugSurvival

This is a project aims to help new and continuing students with their Slug Life.

## Functionalities

### Improved course selections/planning (better than my.ucsc.edu)

(Data source: pisa.ucsc.edu, fetched by [UCSC Courses Fetch](https://github.com/zllovesuki/ucsc))

1. You can search classes *instantly* based on class code, location, instructor name, and class names
2. Class conflicts are detected *instantly*
3. You can add a classes first, sections later
4. RateMyProfessors scores right where you need it
5. Search classes based on preferences, GE, and many criteria (coming soon)
6. Click to save your current planner as a picture (coming soon)

### Major/minor requirement in a graph (coming soon)

1. You no longer have to plow through countless pages of UCSC websites to find your requirements. All courses pre-req and major/minor-req will be visualized in a graph

### Class opening tracker (coming soon)

1. Subscribe to class entrollment opening status in (near) real-time. Inspired by our fellow slug [Brad Bernard's project: SlugWatch](https://slugwatch.com)

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
