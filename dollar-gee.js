(function(){
	
var doc = document;

/**
 * The function that generates DOM elements, based on given element type description and
 * element content.
 * 
 * elDesc should be a string of format:
 *   "[.<tag_name>] [#<id_attr>] [<class1>, ... ,<classN>]"
 *   - default tag name is DIV
 *   - default id attr is empty
 *   - default class attr is empty
 *   
 * elAttrs should be an object with attributes that should be applied to final
 * DOM object. if elAttrs is of type Array, it is accepted as substitute for elContent
 * parameter. this means that elAttrs is optional parameter.
 * 
 * elContent should be an array of elements, or a string.
 * if elContent is a string, the TEXT DOM-object will be created
 * as object content.
 * 
 * Added on 17.11.2009:
 * ===============
 * - gen function now accepts Array type elements in elContent array.
 * It works like this:
 *   var el =
 *   $g('x',
 *       [
 *        ['child1', $g('y', 'in child1')],
 *        ['child2', $g('z', 'in child2')]
 *       ]
 *   );
 *   
 *   el.child1 <- this will be the first child from passed array
 *   el.child2 <- the second one.
 *   
 * Basically, if it finds and array inside of elContent array, it treats it this way:
 * - the first element will be used as name for newly created field
 * - the second element will be used as value for newly created field
 * 
 * This allows convenient DOM structure with fast access to key elements.
 * ===============
 * 
 * Added on 18.11.2009:
 * ===============
 * - now accepting this: $g('bla bla', { bla: bla }, [ [element] ])
 * Note the single-element array inside child elements array.
 * [element] means that FIRST CLASS of element will be used as field name
 * of generated object, and the element itself will be used as value.
 * if element's className is not defined (class attribute is empty), element's
 * ID attribute will be used as a name for created field.
 *  
 * e.g.:
 *   var el =
 *   $g('x',
 *       [
 *        [$g('y', 'child1')],
 *        [$g('z w', 'child2')]
 *        [$g('#q z', 'child3')]
 *       ]
 *   );
 *   
 *   el.y <- defined
 *   el.z <- also, defined
 *   el.q <- defined, too
 *   
 * The previous version of this structuring mechanism should probably be removed.
 * The single-element array construction seems the most syntactically convenient at the
 * moment.
 * ===============
 * 
 * Examples:
 * 
 * $g('xxx') === "<div class='xxx'></div>" 
 * // a DIV element with xxx class
 * 
 * $g('', 'xxx') === "xxx" 
 * // a TEXT element
 * 
 * $g('.a', { href: 'link' }, 'the link') === "<a href='link'>the link</a>" 
 * // an A element with TEXT element inside
 * 
 * $g('#div1', [ $g('#div2 xxx', 'in div2'), $g('#div3 yyy', 'in div3'), 'in div1' ]) === 
 * """<div id='div1'>
 *      <div id='div2' class='xxx'>in div2</div>
 *      <div id='div3' class='yyy'>in div3</div>
 *      in div1
 *    </div>
 * """
 * 
 * Browse down for another, bigger example.
 */
var gen = window.$g = function(elDesc, elAttrs, elContent) {
	if (typeof elDesc === 'string')	{
		var desc = elDesc.split(" ");
		var elType = 'div'; 
		var elId = '';
		var elClass = '';
		for (var k = 0; k < desc.length; k++) {
			// apply element type selection
			if (desc[k][0] === '.')
				elType = desc[k].slice(1);
			// apply element id
			else if (desc[k][0] === '#') 
				elId = desc[k].slice(1);
			// apply CSS classes
			else
				elClass = elClass.concat(' ', desc[k]);
		}
		// remove first space
		elClass = elClass.slice(1);
		
		// create the element
		var el = doc.createElement(elType);
		el.className = elClass;
		el.id = elId;
		
		// HANDLE: $g('...', { ... }, ...)
		// if elAttrs is present (it should be of type object)
		if (Object.prototype.toString.apply(elAttrs) === '[object Object]') {
			// IE 6 compatibility workaround
		    if (elAttrs && elAttrs.style) {
		        var styles = elAttrs.style;
		        delete elAttrs.style;
		        for (var prop in styles) {
		            if (styles.hasOwnProperty(prop)) {
		                try{
		                    el.style[prop] = styles[prop];
		                }catch(e){}
		            }
		        }
		    }
		    
		    for (var attr in elAttrs) {
		        if (elAttrs.hasOwnProperty(attr)) {
		            el[attr] = elAttrs[attr];
		        }
		    }			
		}
		// else, count it as elContent
		else {
			// if it is defined
			if (elAttrs)
				elContent = elAttrs;
		}
		
		// if any content is given as parameter
		if (elContent) {
			// HANDLE: $g('...', ..., '...')
			// if a string is given as content
			if (typeof elContent === 'string') {
				// create inner text element
				el.appendChild(doc.createTextNode(elContent));
			}
			else {
				// HANDLE: $g('...', ..., node)
				// if single node given as content
				if (elContent.nodeType)
					el.appendChild(elContent);
				// HANDLE: $g('...', ..., [ ... ])				
				else {
					// else we expect Array here
					// now we will add children from elContent
					for (var k = 0; k < elContent.length; k++) {
						//Debug(Object.prototype.toString.apply(elContent[k]));
						if (elContent[k].nodeType) {
							// just another DOM element
							el.appendChild(elContent[k]);
						}
						else if (Object.prototype.toString.apply(elContent[k]) === '[object Array]') {
							// HANDLE: ['attrName', element]
							if (elContent[k].length === 2) {
								// [attrName, element] array
								// we expect array of length 2 here
								// first element will be used as a name for
								// a field that will be added to current object and
								// will refer to corresponding element.
								el.appendChild(elContent[k][1]);
								el[elContent[k][0]] = elContent[k][1];
								// WARNING. this should be used only for convenience and
								// only when it's needed and with caution, as original
								// Node object fields might get overwritten.
							}
							// HANDLE: [element]
							else {
								// if we have single element enclosed in array,
								// well add a field to our object with the value of this
								// element and name of FIRST CLASS name of given element.
								// (if there's no class name, we use ID, if there's no ID
								// - we don't add anything.
								// NOTE: this is very odd and should never happen.)
								el.appendChild(elContent[k][0]);
								if (elContent[k][0].id) {
									el[elContent[k][0].id] = elContent[k][0];
								}
								else if (elContent[k][0].className) {
									var s = elContent[k][0].className.split(' ', 1);
									el[s[0]] = elContent[k][0];
								}
							}
						}	
						else if (typeof elContent[k] === 'string') {
							// convert a string to text node
							el.appendChild(doc.createTextNode(elContent[k]));
						}
					}
				}
			}
		}
		
		return el;
	}
	else {
		throw "elDesc is not a string!";
		return null;
	}
};

/* here goes another example:
 
			document.body.appendChild(

			    $g('#firstDiv div1', { onclick: function() { alert(this.id); } },
			        [
				        $g('.b', 'bold text'),
				        $g('div2', { onclick: function() { alert(this.className); } },
						    [
							    $g('.i', 'italic text'),
							    $g('div3', { onclick: function() { alert('hui'); } },
							        [
								        'plain text',
								        $g('.br'),
								        $g('.u', 'underlined text')
								    ]
								) 
							]
						)
				    ]
				)
					
			);

 */
	
})();