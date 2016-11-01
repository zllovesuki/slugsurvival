<template>
    <div>
        <div class="m0 p1">
            <div class="clearfix">
                <span class="btn black h4 left">Filter By: </span>
                <router-link class="h6 white btn clickable right" v-bind:style="{ backgroundColor: colorMap.alert }" :to="{ name: 'term', params: { termId: termId } }" tag="div"><i class="fa fa-calendar fa-lg">&nbsp;</i>Calender View</router-link>
            </div>
        </div>
        <div class="m0 p2 border-top">
            <div class="clearfix">
                <select multiple v-bind:id="ids.subjectID" class="inline-block col col-3" v-model="filter.subject" data-placeholder="Subject...">
                    <option :value="code" v-for="(name, code) in subjectList" v-show="typeof courses[code] !== 'undefined'">({{ code }}) {{ name }}</option>
                </select>
                <select v-bind:id="ids.geID" class="inline-block col col-3" v-model="filter.ge" data-placeholder="GE..." v-if="ids.subjectID !== 'lulz'">
                    <option value="all">(All Classes)</option>
                    <option :value="code" v-for="(desc, code) in ge">({{ code }}) {{ desc }}</option>
                </select>
                <sp<select v-bind:id="ids.timeblockID" class="inline-block col col-3" v-model="filter.timeblock" data-placeholder="Timeblock..." v-if="ids.subjectID !== 'lulz'">
                    <option value="all">(All Timeblocks)</option>
                    <option :value="timeblock" v-for="timeblock in timeblocks">{{ timeblock }}</option>
                </select>
                <s<select v-bind:id="ids.locationID" class="inline-block col col-3" v-model="filter.location" data-placeholder="Location..." v-if="ids.subjectID !== 'lulz'">
                    <option value="all">(All Locations)</option>
                    <option :value="location" v-for="location in locations">{{ location }}</option>
                </select>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    props: {
        filter: {
            type: Object,
            required: true
        },
        ge: {
            type: Object,
            required: true
        },
        timeblocks: {
            type: Array,
            required: true
        },
        locations: {
            type: Array,
            required: true
        },
        courses: {
            type: Object,
            required: true
        },
        ids: {
            type: Object,
            default: function() {
                return {
                    subjectID: 'lulz',
                    geID: '',
                    timeblockID: '',
                    locationID: ''
                }
            }
        }
    },
    data: function() {
        return {

        };
    },
    computed: {
        termId: function() {
            return this.$store.getters.termId;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        subjectList: function() {
            return this.$store.getters.subjectList;
        }
    }
}
</script>
