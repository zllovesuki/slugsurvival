<template>
    <transition-group name="fade" mode="in-out">
        <div id="top-bar" class="rounded fixed top-0" v-bind:class="{ 'bg-black-transparent': !lock }" v-show="lock && historicDataLoaded" key="actions">
            <div class="m0 p0 rounded">
                <div class="clearfix">
                    <div class="right rounded bg-black-transparent">
                        <div class="inline-block m1 h6 white bold clickable" @click="whyReadOnly">Read Only</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white mb2 clearfix h5" key="planner" v-show="historicDataLoaded">
            <div class="m0 p1 mb1">
                <div class="clearfix">
                    <span class="btn black h5">Interactive Academic Planner: </span>
                </div>
                <div class="clearfix">
                    <span class="ml1 btn black h6 muted not-clickable block">
                        Classes are shown based on the their statistical frequencies, not a guarantee that the school will offer these classes in the quarter.
                    </span>
                    <span class="ml1 btn black h6 muted not-clickable block">
                        We also recommend that you use this planner on a larger screen.
                    </span>
                </div>
                <form class="hide" action="/fillAcademicPlannerPDF" target="_blank" method="post" id="fillPDF">
                    <input type="hidden" :name="name" :value="value" v-for="(value, name) in pdfFormData"/>
                </form>
            </div>
            <div class="m0 p1 bg-white" id="planner-container">
                <div class="clearfix center">
                    <div class="inline-block col col-2">
                        <div class="col col-6">
                            <div @click="addYear"
                            v-show="!modifyingTable && !lock"
                            class="h5 black clickable"
                            v-bind:style="{ backgroundColor: colorMap.blank }">
                                <i class="fa fa-plus-square-o fa-lg"></i>
                            </div>
                            <div v-show="modifyingTable && !lock"
                            class="h5 black non-clickable">
                                <i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i>
                            </div>
                        </div>
                        <div class="col col-6" v-show="Object.keys(table).length > 1">
                            <div @click="delYear"
                            v-show="!modifyingTable && !lock"
                            class="h5 black clickable"
                            v-bind:style="{ backgroundColor: colorMap.blank }">
                                <i class="fa fa-minus-square-o fa-lg"></i>
                            </div>
                            <div v-show="modifyingTable && !lock"
                            class="h5 black non-clickable">
                                <i class="fa fa-spinner fa-pulse fa-lg fa-fw"></i>
                            </div>
                        </div>
                        <div class="col col-12" v-show="lock">
                            &nbsp;
                        </div>
                    </div>
                    <div class="inline-block col col-10">
                        <div class="col col-12 h4 bold">
                            <div class="inline-block col col-3" v-bind:class="{ 'italic': quarter == 'fall', 'underline': quarter == 'fall' }" v-for="quarter in quarters" style="text-transform: capitalize;">
                                {{ quarter }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="clearfix border-top" v-for="(matrix, year) in table">
                    <div class="inline-block col col-2">
                        <div class="p1 col col-12 parent-cell">
                            <div class="child-cell h6" @click="focusEdit">
                                <span v-if="year == 1 && editingYear === true">
                                    <input id="editingYear" class="inline-block field" size="4" v-model.lazy="plannerYear" v-on:blur="finishEdit" /> - {{ parseInt(plannerYear) + parseInt(year) }}
                                </span>
                                <span v-show="year > 1 || (year == 1 && editingYear === false)">
                                    <span class="italic underline">
                                        {{ parseInt(plannerYear) + parseInt(year) - 1}}
                                    </span> -
                                    <span>
                                        {{ parseInt(plannerYear) + parseInt(year) }}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="inline-block col col-10">
                        <div class="inline-block col col-3" v-for="(courses, quarter) in matrix">
                            <div class="p1 col col-12">
                                <select multiple style="width: 100%" v-model="table[year][quarter]" v-bind:id="year + '-' + quarter">
                                    <option :value="code" v-for="code in historicFrequency[quarter]" track-by="code">{{ code }}</option>
                                </select>
                            </div>
                            <!--<div class="p1 col col-12 center">
                                <div class="col col-6">
                                    <div @click="addCourse(year, quarter)"
                                    class="h5 black clickable"
                                    v-bind:style="{ backgroundColor: colorMap.blank }">
                                        <i class="fa fa-plus-square-o fa-lg"></i>
                                    </div>
                                </div>
                                <div class="col col-6" v-show="Object.keys(table[year][quarter]).length > 1">
                                    <div @click="delCourse(year, quarter)"
                                    class="h5 black clickable"
                                    v-bind:style="{ backgroundColor: colorMap.blank }">
                                        <i class="fa fa-minus-square-o fa-lg"></i>
                                    </div>
                                </div>
                            </div>-->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" key="export" v-show="historicDataLoaded">
            <div class="m0 p2">
                <div class="clearfix">
                    <div class="right">
                        <div class="sm-flex">
                            <div class="p1 m1 flex-auto h6 btn white clickable" v-bind:style="{ backgroundColor: colorMap.share }" v-on:click.prevent.stop="showShareMenu"><i class="fa fa-share fa-lg">&nbsp;</i>click here to share the planner</div>
                            <div class="p1 m1 flex-auto h6 btn white clickable" v-bind:style="{ backgroundColor: colorMap.TBA }" @click="fillPDF">
                                Export to PDF
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2" key="loading" v-show="!historicDataLoaded">
            <div class="m0 p2">
                <div class="clearfix">
                    Loading data and GUI...
                </div>
            </div>
        </div>
    </transition-group>
</template>

<script>
var helper = require('../../lib/vuex/helper')
module.exports = {
    data: function() {
        return {
            lock: false,
            quarters: ['fall', 'winter', 'spring', 'summer'],
            table: {},
            historicDataLoaded: false,
            selectizeRef: {},
            modifyingTable: false,
            plannerYear: '2016',
            editingYear: false,
            pdfFormData: {}
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        loading: function() {
            return this.$store.getters.loading;
        },
        route: function() {
            return this.$store.getters.route;
        },
        title: function() {
            return this.$store.getters.title;
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        numOfYears: function() {
            return this.$store.getters.numOfYears;
        },
        academicPlanner: function() {
            return this.$store.getters.academicPlanner;
        },
        historicFrequency: function() {
            return this.$store.getters.historicFrequency;
        }
    },
    methods: {
        addYear: function(string) {
            this.modifyingTable = true;
            var self = this;
            this.$nextTick(function() {
                // add some delay so it doesn't lag the user
                setTimeout(function() {
                    var largest = Object.keys(self.table).length === 0 ? 0 : Object.keys(self.table).reduce(function(x,y){
                        return (x > y) ? x : y;
                    });
                    self.$set(self.table, parseInt(largest) + 1, {
                        fall: [],
                        winter: [],
                        spring: [],
                        summer: []
                    } )
                    self.$nextTick(function() {
                        return Bluebird.map(self.quarters, function(quarter) {
                            return self.Selectize(parseInt(largest) + 1, quarter)
                        }, { concurrency: 4 })
                        .then(function() {
                            self.modifyingTable = false;
                            if (string !== 'skipSave') self.savePlanner();
                        })
                    })
                }, 500)
            })
        },
        Selectize: function(year, quarter) {
            var self = this;
            this.selectizeRef[year + '-' + quarter] = $('#' + year + '-' + quarter).selectize({
                placeholder: 'select...',
                dropdownParent: "body",
                hideSelected: true,
                onItemAdd: function(value, $item) {
                    self.table[year][quarter].push(value);
                    self.savePlanner();
                },
                onItemRemove: function(value) {
                    self.table[year][quarter] = self.table[year][quarter].filter(function(el) {
                        return el != value;
                    });
                    self.savePlanner();
                },
                render: {
                    item: function(item, escape) {
                        return '<div class="h6">' + escape(item.value) + '</div>';
                    }
                }
            })
        },
        disableSelectize: function() {
            var self = this;
            return Bluebird.map(Object.keys(self.table), function(year) {
                return Bluebird.map(Object.keys(self.table[year]), function(quarter) {
                    return self.selectizeRef[year + '-' + quarter][0].selectize.disable()
                }, { concurrency: 4 })
            }, { concurrency: 2 })
        },
        unSelectize: function(year, quarter) {
            this.selectizeRef[year + '-' + quarter][0].selectize.destroy()
        },
        delYear: function() {
            var self = this;
            self.alert
            .okBtn('Yes')
            .cancelBtn('No')
            .confirm('Are you sure to remove one year?')
            .then(function(resolved) {
                resolved.event.preventDefault();
                if (resolved.buttonClicked !== 'ok') return;
                self.modifyingTable = true;
                self.$nextTick(function() {
                    // add some delay so it doesn't lag the user
                    setTimeout(function() {
                        var largest = Object.keys(self.table).length === 0 ? -1 : Object.keys(self.table).reduce(function(x,y){
                            return (x > y) ? x : y;
                        });
                        if (largest === -1) return -1;
                        return Bluebird.map(Object.keys(self.table[largest]), function(quarter) {
                            self.unSelectize(largest, quarter);
                            self.$delete(self.table[largest], quarter);
                        })
                        .then(function() {
                            self.$delete(self.table, parseInt(largest));
                            self.modifyingTable = false;
                            self.savePlanner();
                        })
                    }, 500)
                })
            })
        },
        savePlanner: function() {
            var self = this;
            if (self.lock) return;
            return Bluebird.map(Object.keys(self.table), function(year) {
                return Bluebird.map(Object.keys(self.table[year]), function(quarter) {
                    self.table[year][quarter] = self.table[year][quarter].filter(function(v, i, s) {
                        return s.indexOf(v) === i;
                    })
                })
            })
            .then(function() {
                return self.$store.commit('saveAcademicPlanner', {
                    plannerYear: self.plannerYear,
                    table: self.table
                })
            });
        },
        initSelectize: function() {
            var self = this;
            return Bluebird.map(Object.keys(self.table), function(year) {
                return Bluebird.map(Object.keys(self.table[year]), function(quarter) {
                    return self.Selectize(year, quarter);
                }, { concurrency: 4 })
            }, { concurrency: 2 })
            .then(function() {
                if (self.lock) self.disableSelectize();
            })
        },
        focusEdit: function() {
            if (this.lock) return;
            this.editingYear = true
            this.$nextTick(function() {
                $('#editingYear').focus()
            })
        },
        finishEdit: function() {
            this.editingYear = false;
            this.savePlanner();
        },
        fillPDF: function() {
            var self = this;
            var offset = {
                fall: 3,
                winter: 2,
                spring: 1,
                summer: 0
            };
            return Bluebird.map(Object.keys(self.table), function(year) {
                if (year == '1') {
                    self.$set(self.pdfFormData, '20', self.plannerYear.slice(-2))
                    self.$set(self.pdfFormData, '20_' + (1 + parseInt(year)), (parseInt(self.plannerYear.slice(-2)) + 1))
                }else{
                    self.$set(self.pdfFormData, '20_' + (2 * parseInt(year) - 1),  (parseInt(self.plannerYear.slice(-2)) + parseInt(year - 1)))
                    self.$set(self.pdfFormData, '20_' + (2 * parseInt(year)), (parseInt(self.plannerYear.slice(-2)) +  parseInt(year)))
                }
                return Bluebird.map(Object.keys(self.table[year]), function(quarter) {
                    for (var i = 0, length = self.table[year][quarter].length; i < length; i++) {
                        if (year == '1' && quarter == 'fall') {
                            self.$set(self.pdfFormData, i + 1, self.table[year][quarter][i]);
                        }else{
                            self.$set(self.pdfFormData, (i + 1) + '_' + ((year * 4) - offset[quarter]), self.table[year][quarter][i]);
                        }
                    }
                })
            })
            .then(function() {
                if (self.$store.getters.Tracker !== null) {
                    self.$store.getters.Tracker.trackEvent('fillPDF', 'clicked')
                }
                self.$nextTick(function() {
                    $('#fillPDF').submit();
                    return Bluebird.map(Object.keys(self.pdfFormData), function(key) {
                        self.$delete(self.pdfFormData, key);
                    })
                })
            })
        },
        savePlannerAsImage: function() {
            var self = this;
            this.$store.getters.loading.go(30);
            html2canvas(document.getElementById('planner-container'), {
                useCORS: true
            }).then(function(canvas) {
                self.$store.getters.loading.go(60);
                canvas.toBlob(function(blob) {
                    self.$store.getters.loading.go(100);
                    saveAs(blob, 'Academic Planner.png');
                    if (self.$store.getters.Tracker !== null) {
                        self.$store.getters.Tracker.trackEvent('savePlannerAsImage', 'clicked')
                    }
                });
            })
        },
        bookmarkPlanner: function() {
            var html = '';
            this.$store.dispatch('dispatchReplaceHashPlanner');

            html += ['<p>', '<i>', 'Now you can bookmark this page!', '</i>', '</p>'].join('');
            html += ['<p>', 'Your planner will show up when you visit this URL on another device.', '</p>'].join('');
            html += ['<p>', '(That means you can share this URL to your friends!)', '</p>'].join('');
            html += ['<p class="pt1 px2 mt1">', '<input type="text" class="field block bookmark-planner" onmouseover="this.setSelectionRange(0, this.value.length)">', '</p>'].join('');

            this.alert
            .okBtn('I\'m Done!')
            .alert(html)
            .then(function(resolved) {
                window.location.hash = '';
            })

            if (this.$store.getters.Tracker !== null) {
                this.$store.getters.Tracker.trackEvent('bookmarkPlanner', 'clicked')
            }

            setTimeout(function() {
                try {
                    var element = document.getElementsByClassName('bookmark-planner')[0];
                    element.value = window.location.href;
                    element.setSelectionRange(0, element.value.length)
                }catch(e) {}
            }, 500);
        },
        showShareMenu: function() {
            window._vueContext = {};
            window._vueContext.savePlannerAsImage = this.savePlannerAsImage;
            window._vueContext.bookmarkPlanner = this.bookmarkPlanner

            var html = '<p>Share...</p>';
            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline h6 white" style="background-color: ' + this.colorMap.regular + '" onclick="window._vueContext.savePlannerAsImage()">';
            html += 'save as image';
            html += '</a></span>';

            html += '<span class="block mt2">';
            html += '<a class="btn btn-outline h6 white" style="background-color: ' + this.colorMap.regular + '" onclick="window._vueContext.bookmarkPlanner()">';
            html += 'get a bookmark link';
            html += '</a></span>';

            this.alert
            .okBtn('OK')
            .alert(html);

            if (this.$store.getters.Tracker !== null) {
                this.$store.getters.Tracker.trackEvent('showShareMenu', 'clicked')
            }
        },
        whyReadOnly: function() {
            var html = '<p class="h6 muted">Why can\'t I modify the planner?</p>';
            html += '<p>You are accessing the planner via a bookmark link, therefore you cannot make any changes.</p>';
            html += '<hr />';
            html += '<a class="btn" onclick="window.location.href = window.location.href.substr(0, window.location.href.indexOf(\'#\'));">Click here to return to your planner</a>';

            this.alert
            .okBtn('OK')
            .alert(html)
        }
    },
    mounted: function() {
        var self = this;
        var shouldInitSelectize = false;
        this.$store.dispatch('setTitle', 'Planner')
        return self.$store.dispatch('decodeHashPlanner')
        .then(function() {
            // no valid was decoded
            return self.$store.dispatch('loadLocalAcademicPlanner');
        })
        .catch(function(e) {
            // hash was used instead of local copy
            self.lock = true;
        })
        .then(function() {
            if (self.academicPlanner !== null) {
                if (typeof self.academicPlanner.plannerYear !== 'undefined') {
                    self.plannerYear = self.academicPlanner.plannerYear;
                    self.table = self.academicPlanner.table;
                }else{
                    // backward compatibility
                    self.table = self.academicPlanner
                }
            }
            if (Object.keys(self.table).length > 0) {
                shouldInitSelectize = true;
                if (!self.lock) self.alert.okBtn('Cool!').alert('<p>We found a planner saved in your browser!</p>')
            }else{
                //self.addYearAndFull('yes')
                self.addYear('skipSave');
                //self.editingYear = true;
            }
            self.$nextTick(function() {
                self.historicDataLoaded = true;
                self.$nextTick(function() {
                    if (shouldInitSelectize) self.initSelectize();
                })
            })
        })
    },
    beforeDestroy: function() {
        // garbage collection
        var self = this;
        return Bluebird.map(Object.keys(self.table), function(year) {
            return Bluebird.map(Object.keys(self.table[year]), function(quarter) {
                return self.unSelectize(year, quarter);
            }, { concurrency: 4 })
        }, { concurrency: 2 })
    }
}
</script>

<style>
.parent-cell {
    position: relative;
    transform-style: preserve-3d;
}
.child-cell {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 10%);
}
</style>
