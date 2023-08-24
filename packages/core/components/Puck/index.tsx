"use client";

import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { DragDropContext, DragStart } from "react-beautiful-dnd";
import DroppableStrictMode from "../DroppableStrictMode";
import { DraggableComponent } from "../DraggableComponent";
import type { Config, Data, Field } from "../../types/Config";
import { InputOrGroup } from "../InputOrGroup";
import { ComponentList } from "../ComponentList";
import { OutlineList } from "../OutlineList";
import { filter, reorder, replace } from "../../lib";
import { Button } from "../Button";

import { Plugin } from "../../types/Plugin";
import { usePlaceholderStyle } from "../../lib/use-placeholder-style";

import { SidebarSection } from "../SidebarSection";
import { scrollIntoView } from "../../lib/scroll-into-view";
import { Globe, Sidebar } from "react-feather";
import { Heading } from "../Heading";
import { IconButton } from "../IconButton/IconButton";
import { DropZone, DropZoneProvider } from "../DropZone";
import { remove } from "../../lib/remove";
import { insert } from "../../lib/insert";

const Field = () => {};

const defaultPageFields: Record<string, Field> = {
  title: { type: "text" },
};

const PluginRenderer = ({
  children,
  data,
  plugins,
  renderMethod,
}: {
  children: ReactNode;
  data: Data;
  plugins;
  renderMethod: "renderRoot" | "renderRootFields" | "renderFields";
}) => {
  return plugins
    .filter((item) => item[renderMethod])
    .map((item) => item[renderMethod])
    .reduce(
      (accChildren, Item) => <Item data={data}>{accChildren}</Item>,
      children
    );
};

export function Puck({
  config,
  data: initialData = { content: [], root: { title: "" } },
  onChange,
  onPublish,
  plugins = [],
  renderHeader,
  renderHeaderActions,
  headerTitle,
  headerPath,
}: {
  config: Config;
  data: Data;
  onChange?: (data: Data) => void;
  onPublish: (data: Data) => void;
  plugins?: Plugin[];
  renderHeader?: (props: {
    children: ReactNode;
    data: Data;
    setData: (data: Data) => void;
  }) => ReactElement;
  renderHeaderActions?: (props: {
    data: Data;
    setData: (data: Data) => void;
  }) => ReactElement;
  headerTitle?: string;
  headerPath?: string;
}) {
  const [data, setData] = useState(initialData);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const Page = useCallback(
    (pageProps) => (
      <PluginRenderer
        plugins={plugins}
        renderMethod="renderRoot"
        data={pageProps.data}
      >
        {config.root?.render
          ? config.root?.render({ ...pageProps, editMode: true })
          : pageProps.children}
      </PluginRenderer>
    ),
    [config.root]
  );

  const PageFieldWrapper = useCallback(
    (props) => (
      <PluginRenderer
        plugins={plugins}
        renderMethod="renderRootFields"
        data={props.data}
      >
        {props.children}
      </PluginRenderer>
    ),
    []
  );

  const ComponentFieldWrapper = useCallback(
    (props) => (
      <PluginRenderer
        plugins={plugins}
        renderMethod="renderFields"
        data={props.data}
      >
        {props.children}
      </PluginRenderer>
    ),
    []
  );

  const FieldWrapper =
    selectedIndex !== null ? ComponentFieldWrapper : PageFieldWrapper;

  const rootFields = config.root?.fields || defaultPageFields;

  let fields =
    selectedIndex !== null
      ? (config.components[data.content[selectedIndex].type]?.fields as Record<
          string,
          Field<any>
        >) || {}
      : rootFields;

  useEffect(() => {
    if (onChange) onChange(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const { onDragUpdate, placeholderStyle } = usePlaceholderStyle();

  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);

  const [draggedItem, setDraggedItem] = useState<DragStart>();

  return (
    <div className="puck">
      <DragDropContext
        onDragUpdate={onDragUpdate}
        onDragStart={(start) => {
          setDraggedItem(start);
        }}
        onDragEnd={(droppedItem) => {
          setDraggedItem(undefined);

          if (!droppedItem.destination) {
            console.warn("No destination specified");
            return;
          }

          // New component
          if (
            droppedItem.source.droppableId === "component-list" &&
            droppedItem.destination
          ) {
            const emptyComponentData = {
              type: droppedItem.draggableId,
              props: {
                ...(config.components[droppedItem.draggableId].defaultProps ||
                  {}),
                id: `${droppedItem.draggableId}-${new Date().getTime()}`, // TODO make random string
              },
            };

            const newData = { ...data };

            if (droppedItem.destination.droppableId === "puck-drop-zone") {
              newData.content.splice(
                droppedItem.destination.index,
                0,
                emptyComponentData
              );
            } else {
              const [destinationParentId, destinationDropzoneKey] =
                droppedItem.destination.droppableId.split(":");

              newData.content = data.content.map((item) => {
                const dropzones = item.dropzones || {
                  [destinationDropzoneKey]: [],
                };

                const sourceIndex = droppedItem.source.index;
                const destinationIndex = droppedItem.destination!.index;

                if (item.props.id === destinationParentId) {
                  return {
                    ...item,
                    dropzones: {
                      ...dropzones,
                      [destinationDropzoneKey]: insert(
                        dropzones[destinationDropzoneKey] || [],
                        destinationIndex,
                        emptyComponentData
                      ),
                    },
                  };
                }

                return item;
              });
            }

            setData(newData);

            setSelectedIndex(droppedItem.destination.index);

            // Reorder
          } else if (droppedItem.source.droppableId === "puck-drop-zone") {
            setData({
              ...data,
              content: reorder(
                data.content,
                droppedItem.source.index,
                droppedItem.destination.index
              ),
            });

            setSelectedIndex(null);
          } else {
            const [sourceParentId, sourceDropzoneKey] =
              droppedItem.source.droppableId.split(":");

            const [destinationParentId, destinationDropzoneKey] =
              droppedItem.destination.droppableId.split(":");

            const sourceIndex = droppedItem.source.index;
            const destinationIndex = droppedItem.destination.index;

            console.log(
              sourceParentId,
              sourceDropzoneKey,
              destinationParentId,
              destinationDropzoneKey,
              data.content,
              droppedItem.source,
              droppedItem.destination
            );

            let content = [...data.content];

            if (droppedItem.destination.droppableId === "puck-drop-zone") {
              content = insert(
                content,
                destinationIndex,
                content.find(
                  (candidate) => candidate.props.id === sourceParentId
                )?.dropzones![sourceDropzoneKey][sourceIndex]
              );

              console.log("inserted", content);
            }

            content = data.content.map((item) => {
              // TODO i have no way to identify the prop name in the component
              // TODO also auto generated droppableIds clash within the same parent

              const dropzones = item.dropzones || { [sourceDropzoneKey]: [] };

              // Reorder within same dropzone
              if (
                sourceParentId === destinationParentId &&
                sourceDropzoneKey === destinationDropzoneKey
              ) {
                if (item.props.id === sourceParentId) {
                  return {
                    ...item,
                    dropzones: {
                      ...dropzones,
                      [sourceDropzoneKey]: reorder(
                        dropzones[sourceDropzoneKey],
                        sourceIndex,
                        destinationIndex
                      ),
                    },
                  };
                }

                // Move between dropzones
              } else {
                const sourceItem = content.find(
                  (candidate) => candidate.props.id === sourceParentId
                )?.dropzones![sourceDropzoneKey][sourceIndex];

                if (
                  item.props.id === sourceParentId &&
                  item.props.id === destinationParentId
                ) {
                  return {
                    ...item,
                    dropzones: {
                      ...dropzones,
                      [sourceDropzoneKey]: remove(
                        dropzones[sourceDropzoneKey],
                        sourceIndex
                      ),
                      [destinationDropzoneKey]: insert(
                        dropzones[destinationDropzoneKey] || [],
                        destinationIndex,
                        sourceItem
                      ),
                    },
                  };
                } else if (item.props.id === sourceParentId) {
                  return {
                    ...item,
                    dropzones: {
                      ...dropzones,
                      [sourceDropzoneKey]: remove(
                        dropzones[sourceDropzoneKey],
                        sourceIndex
                      ),
                    },
                  };
                } else if (
                  item.props.id === destinationParentId &&
                  destinationParentId !== "puck-drop-zone"
                ) {
                  //  console.log(
                  //     "insert",
                  //     data.content.find(
                  //       (candidate) => candidate.props.id === sourceParentId
                  //     )?.dropzones![sourceDropzoneKey][sourceIndex]
                  //   );

                  return {
                    ...item,
                    dropzones: {
                      ...dropzones,
                      [destinationDropzoneKey]: insert(
                        dropzones[destinationDropzoneKey] || [],
                        destinationIndex,
                        sourceItem
                      ),
                    },
                  };
                }
              }

              return item;
            });

            setData({
              ...data,
              content,
            });
          }
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateAreas: '"header header header" "left editor right"',
            gridTemplateColumns: `${
              leftSidebarVisible ? "288px" : "0px"
            } auto 288px`,
            gridTemplateRows: "min-content auto",
            height: "100vh",
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <header
            style={{
              gridArea: "header",
              borderBottom: "1px solid var(--puck-color-grey-8)",
            }}
          >
            {renderHeader ? (
              renderHeader({
                children: (
                  <Button
                    onClick={() => {
                      onPublish(data);
                    }}
                    icon={<Globe size="14px" />}
                  >
                    Publish
                  </Button>
                ),
                data,
                setData,
              })
            ) : (
              <div
                style={{
                  display: "grid",
                  padding: 16,
                  gridTemplateAreas: '"left middle right"',
                  gridTemplateColumns: "288px auto 288px",
                  gridTemplateRows: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                  }}
                >
                  <IconButton
                    onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
                    title="Toggle left sidebar"
                  >
                    <Sidebar />
                  </IconButton>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Heading rank={2} size="xs">
                    {headerTitle || data.root.title || "Page"}
                    {headerPath && (
                      <small style={{ fontWeight: 400, marginLeft: 4 }}>
                        <code>{headerPath}</code>
                      </small>
                    )}
                  </Heading>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    justifyContent: "flex-end",
                  }}
                >
                  {renderHeaderActions &&
                    renderHeaderActions({ data, setData })}
                  <Button
                    onClick={() => {
                      onPublish(data);
                    }}
                    icon={<Globe size="14px" />}
                  >
                    Publish
                  </Button>
                </div>
              </div>
            )}
          </header>
          <div
            style={{
              gridArea: "left",
              background: "var(--puck-color-grey-11)",
              borderRight: "1px solid var(--puck-color-grey-8)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SidebarSection title="Components">
              <ComponentList config={config} />
            </SidebarSection>
            <SidebarSection title="Outline">
              {data.content.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--puck-color-grey-6)",
                    fontFamily: "var(--puck-font-stack)",
                  }}
                >
                  Add items to your page
                </div>
              )}
              <OutlineList>
                {data.content.map((item, i) => {
                  return (
                    <OutlineList.Item
                      key={i}
                      onClick={() => {
                        setSelectedIndex(i);

                        const id = data.content[i].props.id;

                        scrollIntoView(
                          document.querySelector(
                            `[data-rbd-drag-handle-draggable-id="draggable-${id}"]`
                          ) as HTMLElement
                        );
                      }}
                    >
                      {item.type}
                    </OutlineList.Item>
                  );
                })}
              </OutlineList>
            </SidebarSection>
          </div>
          <div
            style={{
              background: "var(--puck-color-grey-9)",
              padding: 32,
              overflowY: "auto",
              gridArea: "editor",
            }}
            onClick={() => setSelectedIndex(null)}
          >
            <div
              className="puck-root"
              style={{
                background: "white",
                borderRadius: 16,
                border: "1px solid var(--puck-color-grey-8)",
                overflow: "hidden",
                // zoom: 0.75,
              }}
            >
              <Page data={data} {...data.root}>
                <DropZoneProvider
                  value={{
                    content: data.content,
                    selectedIndex,
                    setSelectedIndex,
                    config,
                    setContent: (content) => {
                      setData({ ...data, content });
                    },
                    draggedItem,
                    placeholderStyle,
                  }}
                >
                  <DropZone
                    droppableId="puck-drop-zone"
                    content={data.content}
                    style={{
                      minHeight: 128,
                      position: "relative",
                      // zoom: 1.33,
                    }}
                    // itemStyle={{ zoom: 0.75 }}
                  />
                </DropZoneProvider>
              </Page>
            </div>
          </div>
          <div
            style={{
              borderLeft: "1px solid var(--puck-color-grey-8)",
              overflowY: "auto",
              gridArea: "right",
              fontFamily: "var(--puck-font-stack)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <FieldWrapper data={data}>
              <SidebarSection
                noPadding
                breadcrumb={selectedIndex !== null ? "Page" : ""}
                breadcrumbClick={() => setSelectedIndex(null)}
                title={
                  selectedIndex !== null
                    ? (data.content[selectedIndex].type as string)
                    : "Page"
                }
              >
                {Object.keys(fields).map((fieldName) => {
                  const field = fields[fieldName];

                  const onChange = (value: any) => {
                    let currentProps;
                    let newProps;

                    if (selectedIndex !== null) {
                      currentProps = data.content[selectedIndex].props;
                    } else {
                      currentProps = data.root;
                    }

                    if (fieldName === "_data") {
                      // Reset the link if value is falsey
                      if (!value) {
                        const { locked, ..._meta } = currentProps._meta || {};

                        newProps = {
                          ...currentProps,
                          _data: undefined,
                          _meta: _meta,
                        };
                      } else {
                        const changedFields = filter(
                          // filter out anything not supported by this component
                          value,
                          Object.keys(fields)
                        );

                        newProps = {
                          ...currentProps,
                          ...changedFields,
                          _data: value, // TODO perf - this is duplicative and will make payload larger
                          _meta: {
                            locked: Object.keys(changedFields),
                          },
                        };
                      }
                    } else {
                      newProps = {
                        ...currentProps,
                        [fieldName]: value,
                      };
                    }

                    if (selectedIndex !== null) {
                      setData({
                        ...data,
                        content: replace(data.content, selectedIndex, {
                          ...data.content[selectedIndex],
                          props: newProps,
                        }),
                      });
                    } else {
                      setData({ ...data, root: newProps });
                    }
                  };

                  if (selectedIndex !== null) {
                    return (
                      <InputOrGroup
                        key={`${data.content[selectedIndex].props.id}_${fieldName}`}
                        field={field}
                        name={fieldName}
                        label={field.label}
                        readOnly={
                          data.content[
                            selectedIndex
                          ].props._meta?.locked?.indexOf(fieldName) > -1
                        }
                        value={data.content[selectedIndex].props[fieldName]}
                        onChange={onChange}
                      />
                    );
                  } else {
                    return (
                      <InputOrGroup
                        key={`page_${fieldName}`}
                        field={field}
                        name={fieldName}
                        label={field.label}
                        readOnly={
                          data.root._meta?.locked?.indexOf(fieldName) > -1
                        }
                        value={data.root[fieldName]}
                        onChange={onChange}
                      />
                    );
                  }
                })}
              </SidebarSection>
            </FieldWrapper>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
