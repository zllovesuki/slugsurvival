// Step 1
(function() {
    function loadJquery(cb) {
    	var script = document.createElement('script');
    	script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
    	script.type = 'text/javascript';
    	script.onload = cb
    	document.getElementsByTagName('head')[0].appendChild(script);
    }

    loadJquery(function() {
    	$('#pthnavbca_PORTAL_ROOT_OBJECT')[0].click(); // Main Menu
    	setTimeout(function() {
    		$('#fldra_SCEP_MY_STUDENT_CENTER')[0].click(); // My Student Center Folder
    		setTimeout(function() {
    			$('#crefli_SCEP_STUDENT_CENTER')[0].click(); // My Student Center Page
    		}, 1000)
    	}, 500)
    })
})()

// Step 2
(function() {
    function loadJquery(cb) {
    	var script = document.createElement('script');
    	script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
    	script.type = 'text/javascript';
    	script.onload = cb
    	document.getElementsByTagName('head')[0].appendChild(script);
    }

    loadJquery(function() {
        $('#ptifrmtgtframe').contents().find('#DERIVED_SSS_SCR_SSS_LINK_ANCHOR3')[0].click(); // Enroll
    })
})()

// Step 3

(function() {
    function loadJquery(cb) {
    	var script = document.createElement('script');
    	script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
    	script.type = 'text/javascript';
    	script.onload = cb
    	document.getElementsByTagName('head')[0].appendChild(script);
    }
    var pad = function(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    } // http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript

    var calculateTermName = function(termCode) {
        termCode = termCode % 2000;
        termCode = pad(termCode, 3, 0);
        var quarter = '';
        var name = '';
        switch (termCode[termCode.length - 1]) {
            case '0': // Winter
            quarter = 'Winter';
            break;
            case '2': // Spring
            quarter = 'Spring';
            break;
            case '8': // Fall
            quarter = 'Fall';
            break;
            case '4': // Summer
            quarter = 'Summer';
            break;
        }
        var year = '20' + termCode.substring(0, 2);
        name = year + ' ' + quarter + ' Quarter';
        return name;
    } // from ucsc

    loadJquery(function() {
    	var quarters = $('#ptifrmtgtframe').contents().find('.PSLEVEL2GRIDWBO').find('tr');
    	var td, radio;
    	var termCode = '2172';
    	for (var i = 2; i < quarters.length; i++) {
    		td = $(quarters[i]).find('td')
    		if (td[1] && calculateTermName(termCode) == $(td[1]).text().trim()) {
    			$(td[0]).find('input')[0].click()
    			setTimeout(function() {
                    $('#ptifrmtgtframe').contents().find('#DERIVED_SSS_SCT_SSR_PB_GO')[0].click();
    			}, 500);
                break;
    		}
    	}
    })
})()

// Bookmark

var classes = [
    '62920',
    '60873-null',
    '62271'
]

function loadJquery(cb) {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.slim.min.js';
    script.type = 'text/javascript';
    script.onload = cb
    document.getElementsByTagName('head')[0].appendChild(script);
}

function loadBluebird(cb) {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.4.7/bluebird.min.js';
    script.type = 'text/javascript';
    script.onload = cb
    document.getElementsByTagName('head')[0].appendChild(script);
}

loadBluebird(function() {
    loadJquery(function() {
        var selectInput = function() {
            $('#ptifrmtgtframe').contents().find('input[name=DERIVED_REGFRM1_CLASS_NBR]')[0]
            return Promise.resolve();
        }
        var enterClassNum = function(classNum) {
            $($('#ptifrmtgtframe').contents().find('input[name=DERIVED_REGFRM1_CLASS_NBR]')[0]).val(classNum)
            return Promise.resolve();
        }

        var waitUntilButton = function(text) {
            return new Promise(function(resolve) {
                var polling = function() {
                    setTimeout(function() {
                        if ($('#ptifrmtgtframe').contents().find('a').filter(function(index) { return $(this).text().trim() === text; }).length === 0) {
                            polling()
                        }else{
                            resolve();
                        }
                    }, 100)
                }
                polling();
            });
        }

        var waitUntilCheckbox = function() {
            return new Promise(function(resolve) {
                var polling = function() {
                    setTimeout(function() {
                        if ($('#ptifrmtgtframe').contents().find('.PSCHECKBOX').length === 0) {
                            polling()
                        }else{
                            resolve();
                        }
                    }, 100)
                }
                polling();
            });
        }

        var chooseSection = function(sectionNum) {
            return waitUntilButton('Next').then(function() {
                var sections = $('#ptifrmtgtframe').contents().find('.PSLEVEL1GRID').find('tr');
                var td;

                for (var i = 1; i < sections.length; i++) {
                    td = $(sections[i]).find('td');
                    if ( (sectionNum != 'null' && td[1] && sectionNum == $(td[1]).text().trim())
                    || (td[2] && 'No Selection' == $(td[2]).text().trim())
                    ){
                        $(td[0]).find('input')[0].click()
                        break;
                    }
                }
            })
        }

        var chooseWaitlist = function() {
            return waitUntilCheckbox().then(function() {
                $('#ptifrmtgtframe').contents().find('.PSCHECKBOX')[0].click()
            })
        }

        var bindAdd = function() {
            return waitUntilButton('Enter').then(function() {
                $('#ptifrmtgtframe').contents().find('a').filter(function(index) { return $(this).text().trim() === "Enter"; })[0].click()
            })
        }

        var bindNext = function() {
            return waitUntilButton('Next').then(function() {
                $('#ptifrmtgtframe').contents().find('a').filter(function(index) { return $(this).text().trim() === "Next"; })[0].click()
            });
        }

        var split = null;

        Promise.map(classes, function(classString) {
            split = classString.split('-');
            return selectInput()
            .then(function() {
                return enterClassNum(split[0])
            })
            .then(bindAdd)
            .then(function() {
                return chooseSection(split[1] || 'null')
            })
            .then(function() {
                return bindNext()
            })
            .then(chooseWaitlist)
            .then(function() {
                return bindNext()
            })
            .then(function() {
                return waitUntilButton('Enter')
            })
        }, { concurrency: 1 })
    })
})
