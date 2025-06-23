export class CommonJS {
	constructor(color) {
		this.THEME_COLOR = color;
	}
    
    createPopupContainer(){
        const popupContainer = document.createElement('div');
        popupContainer.classList.add('ol-extension-widget-popup-container');
		Object.assign(popupContainer.style,{
			backgroundColor: "white",
	        boxShadow: "0 2px 5px rgba(0,0,0,0.1)", 
	        border: "1px solid #ccc",
	        borderRadius: "8px", 
  	        minHeight: "60px",
	        maxHeight: "500px"
		});

        return popupContainer;
    };

    createPopupContent(){
        const popupContent = document.createElement('div');
        popupContent.classList.add('ol-extension-widget-popup-content');
		Object.assign(popupContent.style,{
			padding:"7px"
		});

        return popupContent;
    };

	createPopupHeader(headerTitle) {
		const popupHead = document.createElement('div');
        popupHead.classList.add('ol-extension-widget-popup-header');
		Object.assign(popupHead.style,{
			display: "flex",
	        justifyContent: "space-between",
	        backgroundColor: this.THEME_COLOR,
	        padding: "5px",
	        color:"white"
		})
		const popupHeadTitle = document.createElement('div');
		const title = document.createElement('strong');
		title.innerText = headerTitle;
		popupHeadTitle.appendChild(title);
		popupHead.appendChild(popupHeadTitle);

		const popupHeadCloseBtn = document.createElement('div');
		const closeBtn = document.createElement('button');
		closeBtn.classList.add('ol-extension-widget-popup-close-button');
		closeBtn.innerHTML = 'X';
        Object.assign(closeBtn.style,{
            cursor: "pointer",
	        backgroundColor: this.THEME_COLOR,
	        border: "none",
	        color:"white"
        });
		popupHeadCloseBtn.appendChild(closeBtn);
		popupHead.appendChild(popupHeadCloseBtn);
		return { popupHead, closeBtn };
	};

	createDropdown(labelName, options) {
		const parentDiv = document.createElement('div');
		Object.assign(parentDiv.style,{
               display: "flex",
	           flexDirection: "column",
	           gap:"5px",
	           marginBottom: "5px"
        });

		const label = document.createElement('label');
		label.innerText = labelName;
		const select = document.createElement('select');
		options.forEach(option => {
			const newOption = document.createElement('option');
			newOption.value = option.v;
			newOption.innerText = option.t;
			select.appendChild(newOption);
		});

		parentDiv.appendChild(label);
		parentDiv.appendChild(select);
		return parentDiv;
	};

	createButton(buttonType, buttonLabel) {
		const button = document.createElement('button');
		button.innerText = buttonLabel || 'Unnamed Button';

		if (buttonType.toLowerCase() == 'submit') {
			button.classList.add('ol-extension-widget-button-submit');
            Object.assign(button.style,{
                backgroundColor:this.THEME_COLOR,
	            color:"white",
	            border: `1px solid ${this.THEME_COLOR}`,
                cursor: "pointer"
            });

			button.addEventListener('mouseenter', () => {
			  button.style.backgroundColor = `${this.THEME_COLOR}95`; // or any hover color
			});

			button.addEventListener('mouseleave', () => {
			  button.style.backgroundColor = this.THEME_COLOR;
			});
		} else if (buttonType.toLowerCase() == 'reset') {
			button.classList.add('ol-extension-widget-button-reset');
            Object.assign(button.style,{
                backgroundColor:"#969696",
	            color:"white",
	            border: "1px solid #a2a2a2",
                cursor: "pointer"
            })
		}

		return button;
	};

	createToolBtn(buttonLabel, title = '') {
		const toolBtnContainer = document.createElement('div');
		toolBtnContainer.classList.add('ol-extension-widget-button-container');
		const toolBtn = document.createElement('button');
		toolBtn.classList.add('ol-extension-widget-button');
        Object.assign(toolBtn.style,{
            backgroundColor: this.THEME_COLOR,
	        border: `1px solid ${this.THEME_COLOR}`,
	        padding: "6px 10px",
	        marginTop: "5px",
	        cursor: "pointer",
	        borderRadius: "1px",
	        fontSize: "14px",
	        color:"white"
        });
		// 🎯 Hover effect
		toolBtn.addEventListener('mouseenter', () => {
		  toolBtn.style.backgroundColor = `${this.THEME_COLOR}85`; // or any hover color
		});

		toolBtn.addEventListener('mouseleave', () => {
		  toolBtn.style.backgroundColor = this.THEME_COLOR;
		});

		toolBtn.innerHTML = buttonLabel;
		toolBtn.title = title;
		toolBtnContainer.appendChild(toolBtn);
		return { toolBtnContainer, toolBtn };
	};

	createResultTable(properties) {
		const table = document.createElement('table');
        table.style.borderCollapse="collapse";

		const tbody = document.createElement('tbody');
		for (let key in properties) {
			const tr = document.createElement('tr');
			const th = document.createElement('th');
            Object.assign(th.style,{
                width:"150px",
                padding: "2px"
            });

			th.innerHTML = key;
			th.style.textAlign = 'left';
			const td = document.createElement('td');
            Object.assign(td.style,{
                width:"150px",
                padding: "2px"
            });
			td.innerHTML = properties[key];
			tr.appendChild(th);
			tr.appendChild(td);
			tbody.appendChild(tr);
		}
		table.append(tbody);
		return table;
	};
}
