<template>
    <div>
        <div class="m0 p1" v-bind:class="{ 'bg-darken-1': !show }">
            <div class="clearfix">
                <span class="btn black h5 left" @click="show = !show">Filter By: </span>
                <router-link class="p1 h6 white bold clickable right" v-bind:style="{ backgroundColor: colorMap.alert }" :to="{ name: 'term', params: { termId: termId } }" tag="div"><i class="fa fa-calendar fa-lg">&nbsp;</i>Calender View</router-link>
            </div>
        </div>
        <div class="m0 p2 border-top" v-show="show">
            <div class="clearfix">
                <span class="inline-block col col-3">
                    <select multiple v-bind:id="ids.subjectID" class="col col-12">
                        <option :value="code" v-for="(name, code) in subjectList" v-show="typeof courses[code] !== 'undefined'">({{ code }}) {{ name }}</option>
                    </select>
                </span>
                <span class="inline-block col col-3">
                    <select v-bind:id="ids.geID" class="col col-12">
                        <option></option>
                        <option value="all">(All Classes)</option>
                        <option :value="code" v-for="(desc, code) in ge">({{ code }}) {{ desc }}</option>
                    </select>
                </span>
                <span class="inline-block col col-3">
                    <select v-bind:id="ids.timeblockID" class="col col-12">
                        <option></option>
                        <option value="all">(All Timeblocks)</option>
                        <option :value="timeblock" v-for="timeblock in timeblocks">{{ timeblock }}</option>
                    </select>
                </span>
                <span class="inline-block col col-3">
                    <select v-bind:id="ids.locationID" class="col col-12">
                        <option></option>
                        <option value="all">(All Locations)</option>
                        <option :value="location" v-for="location in locations">{{ location }}</option>
                    </select>
                </span>
            </div>
        </div>
    </div>
</template>
<script>
module.exports = {
    props: {
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
            required: true
        }
    },
    data: function() {
        return {
            show: true
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
    },
    mounted: function() {
        var self = this;
        $script.ready('select2', function() {
            setTimeout(function() {
                self.show = false
            }, 500)
        })
    }
}
</script>
