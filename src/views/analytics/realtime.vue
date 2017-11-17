<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">See changes in realtime: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        SlugSurvival enables you to see enrollment changes as they happen.
                    </span>
                    <span class="ml1 btn black h6 muted not-clickable block">
                        Note: in compliance with the school policy, each individual course will be updated every 5 minutes.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <table class="table-light">
                        <thead class="bg-darken-1 h6">
                            <th>Course</th>
                            <th>Quarter</th>
                            <th>Current</th>
                            <th>Past</th>
                            <!--<th>Likely Be Offered</th>
                            <th>Frequency</th>-->
                        </thead>
                        <tbody v-bind:class="{ 'h6': isMobile, 'h5': !isMobile }">
                            <tr v-for="result in []">
                                <td class="nowrap clickable" @click="promptShowCourse(result, result.occur[0])">{{ result.code }}</td>
                                <td class="nowrap clickable" @click="promptShowCourse(result, result.occur[0])">{{ result.qtr }}</td>
                                <td class="nowrap clickable" @click="promptShowCourse(result, result.occur[0])">{{ result.occur[0] }}</td>
                                <td class="nowrap">
                                    <span
                                        v-for="(year, index) in result.occur.slice(1)"
                                        @click="promptShowCourse(result, year)"
                                        class="clickable rainbow"
                                    >
                                        {{ year }}{{ index < result.occur.length - 2 ? ', ' : '' }}
                                    </span>
                                </td>
                                <!--<td>{{ result.pos }}</td>
                                <td>{{ result.fre }}</td>-->
                            </tr>
                        </tbody>
                    </table>
				</div>
			</div>
		</div>
    </div>
</template>
<script>
module.exports = {
    mounted: function() {
        var self = this;
        this.$store.dispatch('setTitle', 'Realtime');
        this.$store.dispatch('hideSpinner')
    },
}
</script>
