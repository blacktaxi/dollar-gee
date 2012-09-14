dollar-gee ($g)
===============

A little routine for *declarative UI definition* (or basically creating DOM nodes.)

- `$g('xxx')` is the same as parsing `<div class='xxx'></div>`
- `$g('', 'xxx')` will be a text element `xxx`
- `$g('.a', { href: 'link' }, 'the link')` will be an `<a>` element with a text element inside: `<a href='link'>the link</a>`
- `$g('#div1', [ $g('#div2 xxx', 'in div2'), $g('#div3 yyy', 'in div3'), 'in div1' ])` will output  
  ```<div id='div1'>
        <div id='div2' class='xxx'>in div2</div>
        <div id='div3' class='yyy'>in div3</div>
        in div1
      </div>
  ```

For a bit more complex example, look inside the source. I used this little thing to create UI tree for an iGoogle app back in the day.