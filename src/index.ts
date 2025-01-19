interface IInfoRow {
    name: string;
    value: string;
    className: string;
}

interface IInputOptions {
    uuid?: string;
    classes: string[];
    label: string;
    labelName: string;
    type: string;
}

interface IRow {
    id: string;
    value: string;
}

interface ISelectOptions {
    uuid?: string;
    classes: string[];
    label: string;
    labelName: string;
    mainOption: string;
    query?: IQueryOptions;
    value?: string;
}

interface IQueryOptions {
    url: string;
    method: string;
    body?: object;
    query?: Record<string, any>;
}

interface ICargo {
    id: string;
    name: string;
    size: number;
}

interface IItemOptions {
    id: string;
    name: string;
    size: number;
}

interface ICard {
    id: string;
    destination: string;
    auto: string;
    cargos: string[];
    type: string;
}

function toggleModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        if (modal.classList.toggle('hidden')) {
            const content = modal.querySelector('.content');
            content!.innerHTML = '';

            const approveBtn = modal.querySelector('#approve');
            approveBtn!.remove();
        }
    }
}

async function query(url: string, method: string, body?: object, query?: Record<string, any>) {
    const request = await fetch(url + (query ? `?${new URLSearchParams(query).toString()}` : ''), {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!request.ok) {
        throw new Error(await request.text());
    }
    return request
}

function validateString(str: string | undefined) {
    return str && str.length > 0;
}

function addRow(element: Element, options: IInfoRow) {
    element.classList.add(options.className);

    let p = element.appendChild(document.createElement('p'));
    p.innerText = options.name;
    p.classList.add('title');

    p = element.appendChild(document.createElement('p'));
    p.innerText = options.value;

    return p;
}

function addInput(element: Element, options: IInputOptions) {
    const container = document.createElement('div');
    container.classList.add(...options.classes);

    const label = document.createElement('label');
    label.htmlFor = options.label + options.uuid;
    label.innerText = options.labelName;

    const input = document.createElement('input');
    input.type = options.type;
    input.id = options.label + options.uuid;

    container.appendChild(label);
    container.appendChild(input);
    element.appendChild(container);

    return input;
}

function addSelect(element: Element, options: ISelectOptions) {
    const container = document.createElement('div');
    container.classList.add(...options.classes);

    const label = document.createElement('label');
    label.htmlFor = options.label + options.uuid;
    label.innerText = options.labelName;

    const select = document.createElement('select');
    select.id = options.label + options.uuid;

    const mainOption = document.createElement('option');
    mainOption.innerText = options.mainOption;
    mainOption.disabled = true;
    select.appendChild(mainOption);

    container.appendChild(label);
    container.appendChild(select);
    element.appendChild(container);

    return select;
}

async function addSelectSql(element: Element, options: ISelectOptions) {
    const select = addSelect(element, options);

    const result = await query(options.query!.url, options.query!.method, options.query!.body, options.query!.query);

    const rows: IRow[] = await result.json();
    for (const row of rows) {
        const option = document.createElement('option');
        option.innerText = row.value;
        option.value = row.id;
        select.appendChild(option);
        if (row.value === options.value) {
            select.value = row.id;
        }
    }

    return select;
}

async function addItems(li: Element, listCont: Element, cargosIds: string[] | undefined) {
    if (cargosIds && cargosIds.length > 0) {
        let result: Response;
        let row: ICargo[];
        for (const cargoId of cargosIds) {
            result = await query('cargo', 'GET', undefined, {id: cargoId});
            row = await result.json();
            addItem(li, listCont, row[0]);
        }
    }
}

function validateCount(li: Element, cargoSize: number) {
    return +li.getAttribute('cargos-last-count')! - cargoSize >= 0;
}

function getSize(value: string) {
    switch (value) {
        case 'Фургон':
            return 4;
        case 'Грузовик':
            return 8;
        case 'Фура':
            return 16;
        default:
            return 0;
    }
}

function addItem(li: Element, listCont: Element, options?: IItemOptions) {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');
    listItem.setAttribute('edited', 'false');
    if (!options) {
        listItem.classList.add('editable');
    } else {
        listItem.id = options.id;
    }

    const id = options ? options.id : crypto.randomUUID();
    const itemId = listItem.appendChild(document.createElement('div'));
    itemId.classList.add('item-id');
    itemId.innerHTML = `<p class="title">ID: ${id}</p>`;

    const itemName = listItem.appendChild(document.createElement('div'));
    itemName.classList.add('item-name');
    itemName.innerHTML = '<p class="title">Наименование:</p>';

    const itemNameInput = addInput(itemName, {
        uuid: id,
        classes: ['inp'],
        label: 'name',
        labelName: '',
        type: 'text'
    });
    itemNameInput.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });

    const itemNameP = itemName.appendChild(document.createElement('p'));
    if (options && options.name) {
        itemNameP.innerText = options.name;
        itemNameInput.value = options.name;
    }
    itemNameP.setAttribute('value', itemNameInput.value);

    const itemSize = listItem.appendChild(document.createElement('div'));
    itemSize.classList.add('item-size');
    itemSize.innerHTML = '<p class="title">Размер груза:</p>';
    const itemSizeInput = addInput(itemSize, {
        uuid: id,
        classes: ['inp'],
        label: 'size',
        labelName: '',
        type: 'number'
    });
    itemSizeInput.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });
    const itemSizeP = itemSize.appendChild(document.createElement('p'));
    if (options && options.size) {
        itemSizeP.innerText = String(options.size);
        itemSizeInput.value = String(options.size);
    }
    itemSizeP.setAttribute('value', itemSizeInput.value);

    const itemButtons = listItem.appendChild(document.createElement('div'));
    itemButtons.classList.add('item-buttons');

    const buttonEdit = itemButtons.appendChild(document.createElement('img')) as HTMLImageElement;
    buttonEdit.src = "../assets/edit.svg";
    buttonEdit.alt = "Edit";
    buttonEdit.addEventListener('click', () => {
        itemNameInput.value = itemNameP.getAttribute('value')!;
        itemSizeInput.value = itemSizeP.getAttribute('value')!;

        listItem.classList.add('editable');

        buttonEdit.classList.toggle('hidden');
        buttonDelete.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });

    const buttonDelete = itemButtons.appendChild(document.createElement('img'));
    buttonDelete.src = "../assets/delete-button.svg";
    buttonDelete.alt = "Delete";
    buttonDelete.addEventListener('click', async () => {
        const uuid = listCont.parentElement!.parentElement!.id;
        await query('voyage', 'POST', {
            itemId: id,
            remove: true,
            cargo: {
                remove: true
            }
        }, {
            id: uuid,
            cargoId: id
        });

        const card = listItem.parentElement!.parentElement!.parentElement!;
        card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count')! + Number(itemSizeInput.value)).toString());
        card.querySelector('.cargos-last-count')!.textContent = card.getAttribute('cargos-last-count');

        listItem.remove();
    });

    const buttonApprove = itemButtons.appendChild(document.createElement('img'));
    buttonApprove.src = "../assets/approve.png";
    buttonApprove.alt = "Approve";
    buttonApprove.addEventListener('click', async () => {

        const card = listItem.parentElement!.parentElement!.parentElement!;
        if (!validateString(itemNameInput.value)) {
            const text = itemNameInput.parentElement!.previousElementSibling!.textContent!;
            alert(`Не заполнено поле ${text.trim().slice(0, text.length - 1)}`);
            return;
        }
        let validationResult: boolean;
        validationResult = validateCount(card, Number(itemSizeInput.value) - Number(itemSizeP.innerText));
        if (!validationResult) {
            alert(`Недостаточно места.\n ` +
                `Оставшееся место для грузов - ${card.getAttribute('cargos-last-count')}.`);
            return;
        }

        if (listItem.getAttribute('edited') === 'true') {
            const uuid = listCont.parentElement!.parentElement!.id;
            if (listItem.id) {
                await query('cargo', 'POST', {
                    name: itemNameInput.value,
                    size: itemSizeInput.value
                }, {
                    id: id
                });
                card.setAttribute('cargos-last-count',
                    (+card.getAttribute('cargos-last-count')! - Number(itemSizeInput.value) +
                        +itemSizeP.getAttribute('value')!).toString());
            } else {
                await query('voyage', 'POST', {
                    itemId: id,
                    cargo: {
                        id: id,
                        name: itemNameInput.value,
                        size: itemSizeInput.value
                    }
                }, {
                    id: uuid,
                    cargoId: id
                });
                card.setAttribute('cargos-last-count',
                    (+card.getAttribute('cargos-last-count')! - Number(itemSizeInput.value)).toString());
            }

            itemNameP.innerText = itemNameInput.value;
            itemSizeP.innerText = itemSizeInput.value;

            itemNameP.setAttribute('value', itemNameInput.value);
            itemSizeP.setAttribute('value', itemSizeInput.value);

            card.querySelector('.cargos-last-count')!.textContent = card.getAttribute('cargos-last-count');

            listItem.id = id;
            enableDragAndDropListItem(listItem);
        }

        listItem.classList.remove('editable');
        listItem.setAttribute('edited', 'false');


        buttonEdit.classList.toggle('hidden');
        buttonDelete.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });

    const buttonCancel = itemButtons.appendChild(document.createElement('img')) as HTMLImageElement;
    buttonCancel.src = "../assets/cancel.png";
    buttonCancel.alt = "Cancel";
    buttonCancel.addEventListener('click', () => {
        if (listItem.id) {
            listItem.classList.remove('editable');

            itemNameInput.value = itemNameP.getAttribute('value')!;
            itemSizeInput.value = itemSizeP.getAttribute('value')!;

            buttonEdit.classList.toggle('hidden');
            buttonDelete.classList.toggle('hidden');
            buttonApprove.classList.toggle('hidden');
            buttonCancel.classList.toggle('hidden');
        } else {
            listItem.remove();
        }
    });

    if (options) {
        buttonApprove.classList.add('hidden');
        buttonCancel.classList.add('hidden');

        li.setAttribute('cargos-last-count', (+li.getAttribute('cargos-last-count')! - Number(itemSizeInput.value)).toString());
    } else {
        buttonEdit.classList.add('hidden');
        buttonDelete.classList.add('hidden');
    }

    listCont.appendChild(listItem);
}

async function createListElement(options: ICard) {
    const list = document.querySelector('.cards-list');

    const li = document.createElement('li');
    li.classList.add('card');
    li.id = options.id
    li.setAttribute('cargos-last-count', (getSize(options.type)).toString());

    const id = document.createElement('div');
    id.innerText = `ID: ${options.id}`;
    li.appendChild(id);

    const mainInfo = document.createElement('div');
    mainInfo.classList.add('main-info');

    let p = mainInfo.appendChild(document.createElement('p'));
    p.innerText = 'Основная информация';

    const buttonsMain = document.createElement('div');
    buttonsMain.classList.add('buttons');

    const buttonEdit = buttonsMain.appendChild(document.createElement('img'));
    buttonEdit.src = '../assets/edit.svg';
    buttonEdit.alt = 'edit';
    buttonEdit.addEventListener('click', () => {
        info.classList.toggle('editable');

        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });

    const buttonApprove = buttonsMain.appendChild(document.createElement('img'));
    buttonApprove.src = '../assets/approve.png';
    buttonApprove.alt = 'edit';
    buttonApprove.classList.add('hidden');
    buttonApprove.addEventListener('click', async () => {
        if (info.getAttribute('edited') === 'true') {

            const items = li.querySelectorAll('.list-item .item-size p:not(.title)');
            let cargoWeight = 0;
            items.forEach(item => cargoWeight += +item.getAttribute('value')!);
            const result = await query('auto', 'GET', undefined, {id:autoSelect.value});
            const type = (await result.json())[0].type;
            if (cargoWeight > getSize(type)) {
                alert('Выбранная машина не позволяет иметь в себе требуемый вес грузов');
                return;
            }

            await query('voyage', 'POST', {
                destination: destinationSelect.value,
                auto: autoSelect.value
            }, {
                id: options.id
            });

            destinationP.innerText = destinationSelect.options[destinationSelect.selectedIndex].text;
            autoP.innerText = autoSelect.options[autoSelect.selectedIndex].text;

            destinationP.setAttribute('value', destinationSelect.value);
            autoP.setAttribute('value', autoSelect.value);

            li.setAttribute('cargos-last-count', (getSize(type) - cargoWeight).toString());
            li.querySelector('.cargos-last-count')!.textContent = li.getAttribute('cargos-last-count');
        }

        info.setAttribute('edited', 'false');
        info.classList.toggle('editable');

        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    })

    const buttonCancel = buttonsMain.appendChild(document.createElement('img'));
    buttonCancel.src = '../assets/cancel.png';
    buttonCancel.alt = 'edit';
    buttonCancel.classList.add('hidden');
    buttonCancel.addEventListener('click', () => {
        info.classList.toggle('editable');

        if (info.getAttribute('edited') === 'true') {
            destinationSelect.value = destinationP.getAttribute('value')!;
            autoSelect.value = autoP.getAttribute('value')!;
        }

        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    mainInfo.appendChild(buttonsMain);

    li.appendChild(mainInfo);

    const info = document.createElement('div');
    info.classList.add('info');
    info.setAttribute('edited', 'false');

    const destination = document.createElement('div');
    const destinationP = addRow(destination, {
        name: 'Место назначения',
        value: options.destination,
        className: 'voyage-destination'
    });
    const destinationSelect = await addSelectSql(destination, {
        uuid: options.id,
        classes: ['inp'],
        label: 'city',
        labelName: '',
        mainOption: 'Город',
        query: {
            url: '/destination',
            method: 'GET'
        },
        value: options.destination,
    });
    destinationP.setAttribute('value', destinationSelect.value);
    destinationSelect.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    })
    info.appendChild(destination);

    const auto = document.createElement('div');
    const autoP = addRow(auto, {
        name: 'Авто',
        value: options.auto,
        className: 'voyage-auto'
    });
    const autoSelect = await addSelectSql(auto!, {
        uuid: options.id,
        classes: ['inp'],
        label: 'auto',
        labelName: '',
        mainOption: 'Авто',
        query: {
            url: '/auto',
            method: 'GET'
        },
        value: options.auto
    });
    autoP.setAttribute('value', autoSelect.value);
    autoSelect.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    })
    info.appendChild(auto);

    const cargosCount = document.createElement('div');
    cargosCount.classList.add('not-editable');

    const cargosCountP = cargosCount.appendChild(document.createElement('p'));
    cargosCountP.classList.add('title');
    cargosCountP.innerText = 'Оставшееся место';

    p = cargosCount.appendChild(document.createElement('p'));
    p.classList.add('cargos-last-count');
    info.appendChild(cargosCount);

    li.appendChild(info);

    const cardList = li.appendChild(document.createElement('div'));
    cardList.classList.add('card-list');

    const cardListP = cardList.appendChild(document.createElement('p'));
    cardListP.innerHTML = 'Список перевозки:';

    const listCont = cardList.appendChild(document.createElement('div'));
    listCont.classList.add('list-cont');

    const addBtn = li.appendChild(document.createElement('button'));
    addBtn.classList.add('add-card-btn');
    addBtn.innerText = 'Добавить груз';
    addBtn.addEventListener('click', () => {
        addItem(li, listCont);
    });

    const deleteBtn = li.appendChild(document.createElement('button'));
    deleteBtn.classList.add('delete-card-btn');
    deleteBtn.innerText = 'Убрать перевозку';
    deleteBtn.addEventListener('click', async () => {
        await query('voyage', 'DELETE', undefined, {id: li.id});

        li.remove();
    });

    await addItems(li, listCont, options.cargos);

    (li.querySelector('.cargos-last-count')! as HTMLElement).innerText = li.getAttribute('cargos-last-count')!;

    list!.insertBefore(li, list!.lastElementChild);

    return li;
}

async function addListElement() {
    const modal = document.querySelector('.modal');
    if (modal) {
        const content = modal.querySelector('.content');

        const destination = await addSelectSql(content!, {
            classes: ['title'],
            label: 'city',
            labelName: 'Место назначения',
            mainOption: 'Город',
            query: {
                url: '/destination',
                method: 'GET'
            },
        });

        const auto = await addSelectSql(content!, {
            classes: ['title'],
            label: 'auto',
            labelName: 'Авто',
            mainOption: 'Авто',
            query: {
                url: '/auto',
                method: 'GET'
            },
        });

        async function createNewListElement() {
            const uuid = crypto.randomUUID();

            await query('/voyage', 'PUT', {
                id: uuid,
                destination: destination.value,
                auto: auto.value,
            });

            const result = await query('auto', 'GET', undefined, {id: auto.value});

            interface IAuto {
                type: string;
            }

            const rows: IAuto[] = await result.json();

            const li = await createListElement({
                id: uuid,
                destination: destination.options[destination.selectedIndex].text,
                auto: auto.options[auto.selectedIndex].text,
                cargos: [],
                type: rows[0].type
            })

            enableDragAndDropCard(li)
        }

        const modalButtons = modal.querySelector('.modal-buttons');

        const approveBtn = document.createElement('img');
        approveBtn.src = '../assets/approve.png';
        approveBtn.alt = 'Approve';
        approveBtn.id = 'approve';
        approveBtn.addEventListener('click', () => {
            try {
                createNewListElement();
                toggleModal();
            } catch (e: any) {
                window.alert(e.message);
            }
        });
        modalButtons!.insertBefore(approveBtn, modalButtons!.firstChild);

        toggleModal();
    }
}

function enableDragAndDropCard(card: HTMLElement) {
    card.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
    });

    card.addEventListener('drop', async (e: DragEvent) => {
        e.preventDefault();
        card.classList.remove('drag-over');

        const data = e.dataTransfer?.getData('text/plain');
        if (!data) return;

        const {itemId, sourceDestination} = JSON.parse(data);
        const draggedItem = document.getElementById(itemId);
        const targetList = card.querySelector<HTMLElement>('.list-cont');
        const targetDestination = card.querySelectorAll<HTMLElement>('.voyage-destination p')[1]?.innerText.trim();

        if (draggedItem && targetList && targetDestination === sourceDestination) {
            const cardId = card.id;

            if (!cardId) return;

            let validationResult: boolean;
            const item = document.getElementById(itemId);
            validationResult = validateCount(card,
                Number((<HTMLInputElement>item!.querySelector('.item-size p:not(.title)')!).innerText));
            if (!validationResult) {
                alert(`Недостаточно места на Автое.\n ` +
                    `Оставшееся место для грузов - ${card.getAttribute('cargos-last-count')}.`);
                return;
            }

            if (!targetList.querySelector('.list-item')) {
                const placeholder = document.createElement('div');
                placeholder.classList.add('list-item-placeholder');
                targetList.appendChild(placeholder);
            }

            const sourceCard = draggedItem.closest('.card');
            const sourceCardId = sourceCard?.id;
            if (sourceCardId) {
                await query('/voyage', 'POST', {
                    itemId,
                    remove: true
                }, {
                    id: sourceCardId
                });
            }

            await query('/voyage', 'POST', {
                itemId,
            }, {
                id: cardId
            });

            targetList.appendChild(draggedItem);

            const placeholder = targetList.querySelector('.list-item-placeholder');
            if (placeholder) placeholder.remove();

            card.setAttribute('cargos-last-count', (+card.getAttribute('cargos-last-count')!
                - +item!.querySelector('.item-size p:not(.title)')!.getAttribute('value')!).toString());
            sourceCard!.setAttribute('cargos-last-count', (+sourceCard!.getAttribute('cargos-last-count')!
                + +item!.querySelector('.item-size p:not(.title)')!.getAttribute('value')!).toString());
            card.querySelector('.cargos-last-count')!.textContent = card.getAttribute('cargos-last-count');
            sourceCard!.querySelector('.cargos-last-count')!.textContent = sourceCard!.getAttribute('cargos-last-count');
        } else {
            alert('Невозможно перенести элемент: точки назначения не совпадают.');
        }
    });
}

function enableDragAndDropListItem(item: HTMLElement) {
    item.draggable = true;
    item.addEventListener('dragstart', (e: DragEvent) => {
        const sourceCard = item.closest('.card');
        const sourceDestination = sourceCard?.querySelectorAll<HTMLElement>('.voyage-destination p')[1]?.innerText.trim();

        if (e.dataTransfer && sourceDestination) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                itemId: item.id,
                sourceDestination
            }));
        }
        item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
    });
}

function enableDragAndDrop() {
    const listItems = document.querySelectorAll<HTMLElement>('.list-item');
    listItems.forEach(enableDragAndDropListItem);

    const cards = document.querySelectorAll<HTMLElement>('.card');
    cards.forEach(enableDragAndDropCard);
}

async function createDestination() {
    const modal = document.querySelector('.modal');
    if (modal) {
        const content = modal.querySelector('.content');

        const id = crypto.randomUUID();
        const idCont = document.createElement('div');
        idCont.innerHTML = `<p>ID: ${id}</p>`;
        content!.appendChild(idCont);

        const cityCont = document.createElement('div');
        const cityInput = addInput(cityCont, {
            classes: [],
            label: 'city',
            labelName: 'Место назначения',
            type: 'text'
        });
        content!.appendChild(cityCont);

        const modalButtons = modal.querySelector('.modal-buttons');

        const approveBtn = document.createElement('img');
        approveBtn.src = '../assets/approve.png';
        approveBtn.alt = 'Approve';
        approveBtn.id = 'approve';
        approveBtn.addEventListener('click', async () => {
            if (!validateString(cityInput.value)) {
                alert(`Не заполнено поле ${cityInput.labels![0].innerText}`)
                return;
            }
            await query('destination', 'PUT', {
                id: id,
                value: cityInput.value,
            });

            const citySelects = document.querySelectorAll(`[id^='city']:not(.modal div)`);
            citySelects.forEach(citySelect => {
                const option = document.createElement('option');
                option.value = id;
                option.innerText = cityInput.value;

                citySelect.appendChild(option);
            });

            toggleModal();
        });
        modalButtons!.insertBefore(approveBtn, modalButtons!.firstChild);

        toggleModal();
    }
}

async function init() {
    const result = await query('allVoyages', 'GET');
    const rows: ICard[] = await result.json();

    for (const row of rows) {
        await createListElement(row);
    }

    enableDragAndDrop();
}
