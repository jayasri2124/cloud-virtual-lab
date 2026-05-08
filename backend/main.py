from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import sqlite3, subprocess, tempfile, os, sys, asyncio, time, shutil, re, uuid, base64
from datetime import datetime

app = FastAPI(title="Cloud Virtual Coding Lab v2", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DB_PATH = os.path.join(os.path.dirname(__file__), "lab.db")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
IS_WINDOWS = sys.platform == "win32"

def find_exe(names):
    for n in names:
        p = shutil.which(n)
        if p: return p
        if os.path.isfile(n): return n
    return None

PYTHON_EXE = find_exe(["python","python3","py"])
GCC_EXE    = find_exe(["gcc","gcc.exe",r"C:\mingw64\bin\gcc.exe",r"C:\msys64\ucrt64\bin\gcc.exe",r"C:\msys64\mingw64\bin\gcc.exe",r"C:\MinGW\bin\gcc.exe"])
GPP_EXE    = find_exe(["g++","g++.exe",r"C:\mingw64\bin\g++.exe",r"C:\msys64\ucrt64\bin\g++.exe",r"C:\msys64\mingw64\bin\g++.exe"])
JAVAC_EXE  = find_exe(["javac","javac.exe",r"C:\Program Files\Java\jdk-17\bin\javac.exe",r"C:\Program Files\Java\jdk-21\bin\javac.exe"])
JAVA_EXE   = find_exe(["java","java.exe",r"C:\Program Files\Java\jdk-17\bin\java.exe",r"C:\Program Files\Java\jdk-21\bin\java.exe"])

print(f"\n{'='*50}\n  Language Status\n{'='*50}")
for name, exe in [("Python",PYTHON_EXE),("GCC",GCC_EXE),("G++",GPP_EXE),("javac",JAVAC_EXE),("java",JAVA_EXE)]:
    print(f"  {name:8}: {exe or 'NOT FOUND'}")
print('='*50+'\n')

# ── SYLLABUS DATA (from Pondicherry University B.Tech CSE PDF) ──────────────────
SYLLABUS = {
    1: {
        "lab": "P 101 - Computer Programming Lab",
        "code": "P101",
        "language": "c",
        "exercises": [
            {"id":1,"title":"Greatest of Three Numbers","desc":"Find the greatest of three numbers using conditional operator and if statement.","hint":"Use if-else or ternary operator. Input: three integers. Output: the greatest.","testcases":[{"input":"3 5 2","expected":"5"},{"input":"10 10 10","expected":"10"},{"input":"-1 -5 -3","expected":"-1"}]},
            {"id":2,"title":"Swap Two Numbers","desc":"Read two numbers and swap them using temporary variable AND without using temporary variable. Show both methods.","hint":"Method 1: use temp variable. Method 2: a=a+b; b=a-b; a=a-b","testcases":[{"input":"5 10","expected":"10 5"},{"input":"0 7","expected":"7 0"}]},
            {"id":3,"title":"Quadratic Equation","desc":"Solve quadratic equation ax²+bx+c=0 for different sets of inputs (real roots, equal roots, complex roots).","hint":"Calculate discriminant D=b²-4ac. If D>0: two real roots, D=0: equal roots, D<0: complex roots.","testcases":[{"input":"1 -5 6","expected":"3.00 2.00"},{"input":"1 2 1","expected":"-1.00"},{"input":"1 1 1","expected":"complex"}]},
            {"id":4,"title":"Switch-Case Menu","desc":"Implement a calculator using Switch-Case statements supporting +, -, *, / operations.","hint":"Use switch(operator) with cases for each operation.","testcases":[{"input":"10 + 5","expected":"15"},{"input":"10 / 2","expected":"5"},{"input":"3 * 4","expected":"12"}]},
            {"id":5,"title":"Prime and Fibonacci Series","desc":"Generate prime numbers up to N AND Fibonacci series up to N terms.","hint":"For prime: check divisibility up to sqrt(n). For Fibonacci: f(n)=f(n-1)+f(n-2).","testcases":[{"input":"10","expected":"2 3 5 7"},{"input":"7","expected":"0 1 1 2 3 5 8"}]},
            {"id":6,"title":"Cosine Series","desc":"Evaluate the COSINE series cos(x) = 1 - x²/2! + x⁴/4! - ... using for, while and do-while loops.","hint":"cos(x) = sum of (-1)^n * x^(2n) / (2n)! for n=0,1,2,...","testcases":[{"input":"0","expected":"1.000000"},{"input":"3.14159","expected":"-1.000000"}]},
            {"id":7,"title":"Matrix Operations","desc":"Perform matrix operations: a) Addition b) Transpose c) Multiplication on 2×2 matrices.","hint":"For multiply: result[i][j] = sum of row[i] * col[j].","testcases":[{"input":"1 2 3 4 5 6 7 8","expected":"addition multiply transpose"}]},
            {"id":8,"title":"Sin(x) Series with Functions","desc":"Evaluate sin(x) series using functions and recursive functions. sin(x) = x - x³/3! + x⁵/5! - ...","hint":"Write a recursive factorial function. sin(x) = sum(-1^n * x^(2n+1) / (2n+1)!)","testcases":[{"input":"0","expected":"0.000000"},{"input":"1.5708","expected":"1.000000"}]},
            {"id":9,"title":"Remove Duplicate Characters","desc":"Read a string and remove duplicate characters from the given sentence.","hint":"Use a boolean array of 256 chars to track seen characters.","testcases":[{"input":"programming","expected":"progamin"},{"input":"hello","expected":"helo"}]},
            {"id":10,"title":"Structure and File","desc":"Create an array of structures for items (Item_Code, Item_Name). Sort by Item_Code ascending and Item_Name descending. Write to file.","hint":"Define struct Item{int code; char name[50];}. Use qsort or bubble sort.","testcases":[{"input":"3","expected":"sorted output"}]},
            {"id":11,"title":"Pointers and Array of Pointers","desc":"Demonstrate use of pointers: pointer arithmetic, pointer to array, array of pointers to strings.","hint":"int *p = &a; char *arr[] = {\"one\",\"two\",\"three\"};","testcases":[{"input":"5","expected":"pointer demo"}]},
            {"id":12,"title":"Static Functions","desc":"Demonstrate functions with static data types. Show how static variable retains value between calls.","hint":"static int count = 0; count++;","testcases":[{"input":"5","expected":"static count"}]},
            {"id":13,"title":"Command Line File Operations","desc":"Write command line program to implement DOS commands: Del (delete file) and Copy (copy file) using file operations.","hint":"Use fopen, fclose, fread, fwrite, remove() functions.","testcases":[{"input":"test.txt","expected":"file operations"}]},
            {"id":14,"title":"Linked List Operations","desc":"Implement singly linked list with insert, delete, search and display operations.","hint":"struct Node{int data; struct Node* next;}; Use malloc for dynamic allocation.","testcases":[{"input":"1 2 3 4 5","expected":"1 2 3 4 5"},{"input":"delete 3","expected":"1 2 4 5"}]},
            {"id":15,"title":"Stack using Array","desc":"Implement stack using array with push, pop, peek, isEmpty, isFull operations.","hint":"Use top pointer. Push: stack[++top]=val. Pop: return stack[top--].","testcases":[{"input":"push 1 push 2 push 3 pop","expected":"3 stack: 1 2"}]},
            {"id":16,"title":"Binary Search Tree","desc":"Create a Binary Search Tree with insert, inorder, preorder, postorder traversal.","hint":"BST property: left < root < right. Inorder gives sorted output.","testcases":[{"input":"5 3 7 1 4","expected":"inorder: 1 3 4 5 7"}]},
            {"id":17,"title":"File Handling - Student Record","desc":"Create student records (Name, Roll, Marks) and write to file. Read back and display. Calculate average.","hint":"Use struct Student and fwrite/fread for binary file operations.","testcases":[{"input":"3 students","expected":"records written and read"}]},
        ]
    },
    3: {
        "lab": "CS P33 - Data Structures Laboratory",
        "code": "CSP33",
        "language": "c",
        "exercises": [
            {"id":1,"title":"Searching Algorithms","desc":"Implement sequential search, binary search and Fibonacci search on an ordered list. Compare key comparisons.","hint":"Binary search: mid=(low+high)/2. Fibonacci search uses Fibonacci numbers as indices.","testcases":[{"input":"10 20 30 40 50 search 30","expected":"found at index 2"},{"input":"1 3 5 7 9 search 6","expected":"not found"}]},
            {"id":2,"title":"Sorting Algorithms","desc":"Implement any five: Insertion Sort, Selection Sort, Bubble Sort, Quick Sort, Merge Sort, Heap Sort, Shell Sort, Radix Sort.","hint":"Quick Sort: partition around pivot. Merge Sort: divide and conquer.","testcases":[{"input":"64 34 25 12 22 11 90","expected":"11 12 22 25 34 64 90"}]},
            {"id":3,"title":"Sparse Matrix","desc":"Represent sparse matrix and find its transpose using triple representation (row, col, value).","hint":"Store only non-zero elements as (row, col, value) triples.","testcases":[{"input":"0 0 3 0 4 0 5 0 0","expected":"transpose representation"}]},
            {"id":4,"title":"Expression Evaluation","desc":"Evaluate arithmetic expression using stack (infix to postfix conversion and evaluation).","hint":"Use operator precedence: * / before + -. Use stack for operators.","testcases":[{"input":"3+4*2","expected":"11"},{"input":"(2+3)*4","expected":"20"}]},
            {"id":5,"title":"Queue Variants","desc":"Implement Queue, Circular Queue, Priority Queue, and Dequeue with all operations.","hint":"Circular queue: rear=(rear+1)%MAX. Priority queue: insert based on priority.","testcases":[{"input":"enqueue 1 2 3 dequeue","expected":"1"},{"input":"circular full test","expected":"queue full"}]},
            {"id":6,"title":"Linked Lists","desc":"Implement Singly Linked List, Doubly Linked List, and Circular Linked List with insert/delete/display.","hint":"DLL has both prev and next pointers. Circular: last node points to first.","testcases":[{"input":"insert 1 2 3 delete 2","expected":"1 3"},{"input":"doubly 1 2 3","expected":"1 2 3 and 3 2 1"}]},
            {"id":7,"title":"Tree Traversal","desc":"Build a binary tree and implement inorder, preorder, postorder traversal techniques.","hint":"Inorder: left-root-right. Preorder: root-left-right. Postorder: left-right-root.","testcases":[{"input":"1 2 3 4 5","expected":"inorder preorder postorder"}]},
            {"id":8,"title":"Graph Traversal","desc":"Implement BFS (Breadth First Search) and DFS (Depth First Search) graph traversal techniques.","hint":"BFS uses queue. DFS uses stack or recursion.","testcases":[{"input":"5 vertices 4 edges","expected":"BFS: 0 1 2 3 4"},{"input":"DFS start 0","expected":"DFS: 0 1 3 4 2"}]},
            {"id":9,"title":"Dijkstra's Shortest Path","desc":"Implement Dijkstra's algorithm to find shortest path from source to all vertices.","hint":"Use priority queue / greedy approach. Relax edges repeatedly.","testcases":[{"input":"4 vertices source 0","expected":"0 to 1: 3 0 to 2: 1 0 to 3: 4"}]},
            {"id":10,"title":"Hash Tables","desc":"Implement hash table with collision handling using chaining or open addressing.","hint":"Hash function: key % table_size. Handle collision with chaining (linked list).","testcases":[{"input":"insert 15 25 35","expected":"hash table with chains"},{"input":"search 25","expected":"found"}]},
            {"id":11,"title":"B-Tree Indexing","desc":"Implement B-Tree with insertion and searching. Show the tree structure after each insertion.","hint":"B-Tree of order m: each node has at most m children. Split when node is full.","testcases":[{"input":"10 20 30 40 50","expected":"B-tree structure"}]},
        ]
    },
    4: {
        "lab": "CS P42 - Design and Analysis of Algorithms Laboratory",
        "code": "CSP42",
        "language": "c",
        "exercises": [
            {"id":1,"title":"Sorting with Complexity Analysis","desc":"Implement sorting algorithms with analysis of time and space complexity. Count comparisons and swaps.","hint":"Measure actual operations. Bubble: O(n²), Merge: O(n log n), Quick: O(n log n) avg.","testcases":[{"input":"10 elements","expected":"sorted with complexity report"}]},
            {"id":2,"title":"Searching with Complexity","desc":"Implement linear and binary search with time complexity analysis.","hint":"Linear: O(n) worst case. Binary: O(log n). Count comparisons.","testcases":[{"input":"sorted 1 to 20 search 15","expected":"found comparisons: 4"}]},
            {"id":3,"title":"Divide and Conquer","desc":"Solve problems using Divide-and-Conquer: Merge Sort, Binary Search, Strassen's Matrix Multiply.","hint":"Recurrence T(n) = 2T(n/2) + O(n) for merge sort → O(n log n).","testcases":[{"input":"8 elements","expected":"sorted using divide conquer"}]},
            {"id":4,"title":"Greedy Algorithms","desc":"Solve problems using Greedy: Fractional Knapsack, Activity Selection, Huffman Coding.","hint":"Greedy: make locally optimal choice at each step.","testcases":[{"input":"weights 2 3 5 values 3 4 5 capacity 5","expected":"max value: 7.0"}]},
            {"id":5,"title":"Dynamic Programming","desc":"Solve using DP: 0/1 Knapsack, Longest Common Subsequence, Matrix Chain Multiplication.","hint":"Build table bottom-up. DP[i][j] = optimal solution for subproblem.","testcases":[{"input":"ABCBDAB BDCAB","expected":"LCS: 4 BCAB"}]},
            {"id":6,"title":"Graph Traversal Algorithms","desc":"Implement BFS and DFS traversal with applications: connected components, cycle detection.","hint":"BFS for shortest path in unweighted graph. DFS for topological sort.","testcases":[{"input":"6 vertices","expected":"BFS DFS traversal"}]},
            {"id":7,"title":"Backtracking","desc":"Implement N-Queens problem and Rat-in-a-Maze using backtracking.","hint":"Place queen, check conflicts, if conflict backtrack. Explore all possibilities.","testcases":[{"input":"4","expected":"solution for 4-queens"}]},
            {"id":8,"title":"Branch and Bound","desc":"Solve 0/1 Knapsack and Travelling Salesman Problem using Branch and Bound.","hint":"Use upper bound to prune branches. Priority queue for best-first search.","testcases":[{"input":"TSP 4 cities","expected":"optimal tour cost"}]},
            {"id":9,"title":"NP-Complete Problems","desc":"Solve NP-Complete problems using heuristics: Graph Coloring, Vertex Cover, Set Cover.","hint":"Use greedy heuristics. Show approximation ratio.","testcases":[{"input":"graph 5 vertices","expected":"coloring with k colors"}]},
        ]
    },
    4.3: {
        "lab": "CS P43 - OOP Languages Laboratory",
        "code": "CSP43",
        "language": "cpp",
        "exercises": [
            {"id":1,"title":"Classes, Objects and Namespaces (C++)","desc":"Demonstrate Classes, Objects, constructors in namespaces. Create a BankAccount class.","hint":"class BankAccount{ private: double balance; public: void deposit(); };","testcases":[{"input":"deposit 1000 withdraw 500","expected":"balance: 500"}]},
            {"id":2,"title":"Constructors and Destructors","desc":"Demonstrate default, parameterized, copy constructors and destructor with a Matrix class.","hint":"Matrix(int r, int c); Matrix(const Matrix& m); ~Matrix();","testcases":[{"input":"2x2 matrix","expected":"constructor destructor called"}]},
            {"id":3,"title":"Operator Overloading","desc":"Overload +, -, *, == operators for a Complex number class.","hint":"Complex operator+(const Complex& c){ return Complex(real+c.real, imag+c.imag); }","testcases":[{"input":"2+3i + 1+4i","expected":"3+7i"}]},
            {"id":4,"title":"Inheritance","desc":"Implement single, multilevel, multiple and hierarchical inheritance with Shape hierarchy.","hint":"class Circle: public Shape{}; class Cylinder: public Circle{};","testcases":[{"input":"circle radius 5","expected":"area: 78.54"}]},
            {"id":5,"title":"Polymorphism and Virtual Functions","desc":"Demonstrate runtime polymorphism using virtual functions with Animal class hierarchy.","hint":"virtual void speak() = 0; Dog overrides speak() to print Woof.","testcases":[{"input":"dog cat","expected":"Woof Meow"}]},
            {"id":6,"title":"Exception Handling (C++)","desc":"Implement exception handling for divide by zero, array out of bounds, custom exceptions.","hint":"try{ if(b==0) throw DivByZero(); }catch(DivByZero& e){ cout<<e.what(); }","testcases":[{"input":"10 0","expected":"exception: division by zero"}]},
            {"id":7,"title":"Templates","desc":"Implement function templates and class templates for generic Stack and Pair.","hint":"template<typename T> class Stack{ T arr[100]; int top; };","testcases":[{"input":"int stack push 1 2 3","expected":"3 2 1"},{"input":"string stack push hi","expected":"hi"}]},
            {"id":8,"title":"Java - Inheritance","desc":"Implement inheritance in Java: Animal→Dog→GuideDog with method overriding.","hint":"class Dog extends Animal{ @Override void speak(){} }","testcases":[{"input":"GuideDog","expected":"Animal Dog GuideDog"}]},
            {"id":9,"title":"Java - Exception Handling","desc":"Java exception handling: checked (IOException), unchecked (NullPointerException), custom exceptions.","hint":"class InsufficientFundsException extends Exception{}","testcases":[{"input":"withdraw 1000 balance 500","expected":"InsufficientFundsException"}]},
            {"id":10,"title":"Java - Collections","desc":"Demonstrate ArrayList, LinkedList, HashMap, HashSet with CRUD operations.","hint":"Map<String,Integer> map = new HashMap<>(); map.put(\"a\",1);","testcases":[{"input":"add Alice 25 Bob 30","expected":"Alice=25 Bob=30"}]},
            {"id":11,"title":"Java - Multithreading","desc":"Create threads using Thread class and Runnable interface. Demonstrate synchronization.","hint":"class MyThread extends Thread{ public void run(){} }","testcases":[{"input":"3 threads","expected":"Thread 1 2 3 running"}]},
        ]
    },
    5: {
        "lab": "CS P53 - Operating Systems Laboratory",
        "code": "CSP53",
        "language": "c",
        "exercises": [
            {"id":1,"title":"UNIX/Linux Basic Commands","desc":"Write a C program that simulates basic UNIX commands: ls (list files), pwd (print working directory), mkdir.","hint":"Use opendir(), readdir(), getcwd() system calls.","testcases":[{"input":"simulate ls","expected":"file listing"}]},
            {"id":2,"title":"Shell Programming","desc":"Write shell scripts for: arithmetic operations, conditional statements, loops, string operations.","hint":"#!/bin/bash. Use $1,$2 for args. if [ $a -gt $b ]; then ... fi","testcases":[{"input":"factorial 5","expected":"120"}]},
            {"id":3,"title":"fork() and exec() System Calls","desc":"Demonstrate fork(), exec(), getpid(), exit(), wait() system calls. Create parent-child process.","hint":"pid_t pid = fork(); if(pid==0){child process}else{parent}","testcases":[{"input":"fork demo","expected":"parent pid child pid"}]},
            {"id":4,"title":"I/O System Calls","desc":"Use UNIX I/O system calls: open(), read(), write(), close() to copy a file.","hint":"int fd = open(\"file\",O_RDONLY); read(fd, buf, size);","testcases":[{"input":"copy file1 file2","expected":"file copied successfully"}]},
            {"id":5,"title":"CPU Scheduling Algorithms","desc":"Simulate CPU scheduling: FCFS, SJF, Round Robin, Priority Scheduling. Calculate waiting time, turnaround time.","hint":"For FCFS: sort by arrival time. For RR: use time quantum.","testcases":[{"input":"3 processes burst 6 8 7","expected":"avg waiting time"}]},
            {"id":6,"title":"Semaphore - Producer Consumer","desc":"Simulate Producer-Consumer problem using semaphores for synchronization.","hint":"sem_wait(&empty); produce; sem_post(&full); Use mutex for buffer access.","testcases":[{"input":"buffer size 5","expected":"producer consumer synchronized"}]},
            {"id":7,"title":"Memory Management","desc":"Simulate memory allocation: First Fit, Best Fit, Worst Fit algorithms.","hint":"First Fit: allocate first block that fits. Best Fit: smallest sufficient block.","testcases":[{"input":"blocks 100 500 200 300 600 process 212 417","expected":"allocation results"}]},
            {"id":8,"title":"Page Replacement Algorithms","desc":"Simulate page replacement: FIFO, LRU, Optimal. Calculate page faults.","hint":"For LRU: replace least recently used page. Count page faults.","testcases":[{"input":"frames 3 pages 7 0 1 2 0 3 0 4","expected":"page faults: 4"}]},
            {"id":9,"title":"Disk Scheduling Algorithms","desc":"Simulate disk scheduling: FCFS, SSTF, SCAN, C-SCAN. Calculate total head movement.","hint":"SSTF: serve closest request first. SCAN: elevator algorithm.","testcases":[{"input":"head 50 requests 82 170 43 140 24 16 190","expected":"total movement"}]},
            {"id":10,"title":"File System Simulation","desc":"Simulate file system operations: create, delete, read, write with directory structure.","hint":"Maintain FAT (File Allocation Table) or inode structure.","testcases":[{"input":"create dir mkdir /home","expected":"file system operations"}]},
        ]
    },
    5.1: {
        "lab": "CS P51 - Computer Networks Laboratory",
        "code": "CSP51",
        "language": "c",
        "exercises": [
            {"id":1,"title":"Socket - Echo/Ping","desc":"Implement socket program for Echo server/client. Client sends message, server echoes it back.","hint":"socket()→bind()→listen()→accept()→recv()→send(). Use AF_INET, SOCK_STREAM.","testcases":[{"input":"hello server","expected":"echo: hello server"}]},
            {"id":2,"title":"TCP File Transfer","desc":"Create TCP socket between two computers for file transfer.","hint":"Server: bind, listen, accept. Client: connect. Use fread/fwrite with send/recv.","testcases":[{"input":"transfer test.txt","expected":"file transferred successfully"}]},
            {"id":3,"title":"CRC Error Detection","desc":"Implement CRC (Cyclic Redundancy Check) and Hamming code for error detection.","hint":"CRC: divide message by generator polynomial. Hamming: add parity bits at power-of-2 positions.","testcases":[{"input":"1101011011 generator 10011","expected":"CRC remainder"}]},
            {"id":4,"title":"Sliding Window Protocol","desc":"Write program simulating Sliding Window Protocol (Go-Back-N and Selective Repeat).","hint":"Sender window size W. Send W frames before waiting for ACK.","testcases":[{"input":"window size 3 frames 7","expected":"sliding window simulation"}]},
            {"id":5,"title":"HTTP Socket","desc":"Create socket for HTTP. Send GET request and receive webpage content.","hint":"Send: GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n","testcases":[{"input":"GET / HTTP/1.0","expected":"HTTP/1.0 200 OK"}]},
            {"id":6,"title":"UDP File Transfer","desc":"Implement file transfer using UDP with reliability mechanisms.","hint":"UDP: SOCK_DGRAM. Add sequence numbers for reliability.","testcases":[{"input":"UDP send file","expected":"file transferred with UDP"}]},
            {"id":7,"title":"ARP Implementation","desc":"Implement ARP (Address Resolution Protocol) to map IP to MAC address.","hint":"Send ARP request broadcast. Cache ARP responses in table.","testcases":[{"input":"IP 192.168.1.1","expected":"MAC address"}]},
        ]
    },
    6: {
        "lab": "CS P61 - Database Management Systems Laboratory",
        "code": "CSP61",
        "language": "python",
        "exercises": [
            {"id":1,"title":"SQL - Table Operations","desc":"Create tables, perform INSERT, SELECT, UPDATE, DELETE operations. Create indexes and views.","hint":"CREATE TABLE Student(id INT PRIMARY KEY, name VARCHAR(50), marks FLOAT);","testcases":[{"input":"create insert select","expected":"table operations successful"}]},
            {"id":2,"title":"SQL Query Types","desc":"Write SQL queries involving JOIN (inner, outer, cross), subqueries, nested queries, correlated queries.","hint":"SELECT s.name, d.dept FROM student s INNER JOIN dept d ON s.dept_id=d.id;","testcases":[{"input":"join query","expected":"joined result set"}]},
            {"id":3,"title":"Set Operations","desc":"SQL queries using UNION, INTERSECTION, DIFFERENCE, Cartesian product operations.","hint":"SELECT * FROM A UNION SELECT * FROM B; EXCEPT for difference.","testcases":[{"input":"union intersect","expected":"set operation results"}]},
            {"id":4,"title":"PL/SQL Procedures and Functions","desc":"Write PL/SQL blocks with exception handling, stored procedures, functions, cursors, triggers.","hint":"CREATE PROCEDURE proc_name AS BEGIN ... END; DECLARE CURSOR c1 IS SELECT ...","testcases":[{"input":"procedure call","expected":"procedure executed"}]},
            {"id":5,"title":"Library Management System","desc":"Design and develop Library Information System with Book, Member, Issue, Return tables.","hint":"Tables: Book(isbn, title, author), Member(id, name), IssueRecord(book_isbn, member_id, date).","testcases":[{"input":"issue book","expected":"book issued successfully"}]},
            {"id":6,"title":"Student Information System","desc":"Build complete Students' Information System with CRUD, search, reports using SQL.","hint":"Tables: Student, Course, Enrollment, Grade. Use transactions for updates.","testcases":[{"input":"enroll student","expected":"enrollment successful"}]},
        ]
    },
    7: {
        "lab": "CS P72 - Distributed and Intelligent Computing Laboratory",
        "code": "CSP72",
        "language": "java",
        "exercises": [
            {"id":1,"title":"RMI - Simple Interest","desc":"Find Simple and Compound Interest using RMI (Remote Method Invocation).","hint":"Define interface extends Remote. Server implements. Client looks up registry.","testcases":[{"input":"principal 1000 rate 5 time 2","expected":"SI: 100.0 CI: 102.50"}]},
            {"id":2,"title":"RMI - Airline Reservation","desc":"Implement RMI-based Airline Reservation system with book, cancel, check operations.","hint":"interface AirlineService extends Remote{ boolean bookSeat(int flightNo, int seats); }","testcases":[{"input":"book flight 101 2 seats","expected":"booking confirmed"}]},
            {"id":3,"title":"Servlet - Airline Reservation","desc":"Servlet-based implementation of Airline Reservation with HTML form interface.","hint":"HttpServlet → doPost() handles form data. Use JDBC for database.","testcases":[{"input":"POST book flight","expected":"HTTP 200 booking page"}]},
            {"id":4,"title":"PROLOG - Water Jug Problem","desc":"Solve Water Jug Problem using DFS and BFS in PROLOG.","hint":"state(X,Y). move(state(X,Y),state(X1,Y)) :- X1 is X+1, X1 =< 4.","testcases":[{"input":"4 3 jugs goal 2","expected":"solution path"}]},
            {"id":5,"title":"A* Algorithm","desc":"Implement A* pathfinding algorithm for a grid-based map.","hint":"f(n) = g(n) + h(n). g=actual cost, h=heuristic (Manhattan distance).","testcases":[{"input":"5x5 grid start 0,0 goal 4,4","expected":"optimal path"}]},
            {"id":6,"title":"Rule-Based Expert System","desc":"Develop a rule-based system for medical diagnosis or any application of choice.","hint":"if symptom(fever) and symptom(cough) then disease(flu).","testcases":[{"input":"symptoms fever cough","expected":"diagnosis: flu"}]},
        ]
    },
    8: {
        "lab": "CS P81 - Advanced Computing Laboratory",
        "code": "CSP81",
        "language": "python",
        "exercises": [
            {"id":1,"title":"Producer-Consumer Framework","desc":"Implement a Producer-Consumer framework with concurrent threads and shared buffer.","hint":"Use threading.Lock(), threading.Semaphore(). Producer adds, consumer removes.","testcases":[{"input":"3 producers 2 consumers","expected":"items produced and consumed"}]},
            {"id":2,"title":"2D Transformations","desc":"Implement 2D transformations: Translation, Scaling, Rotation, Mirror Reflection, Shearing with menu.","hint":"Translation: [x+tx, y+ty]. Rotation: [x*cos-y*sin, x*sin+y*cos].","testcases":[{"input":"point 3 4 translate 2 3","expected":"5 7"},{"input":"point 1 0 rotate 90","expected":"0 1"}]},
            {"id":3,"title":"Image Compression","desc":"Implement image compression algorithms: RLE (Run Length Encoding) and Huffman Coding.","hint":"RLE: AAABBC → 3A2B1C. Huffman: variable length codes based on frequency.","testcases":[{"input":"AAABBBCCDDDD","expected":"3A3B2C4D"},{"input":"huffman encode abracadabra","expected":"encoded bits"}]},
            {"id":4,"title":"Deadlock Detection","desc":"Implement Deadlock Detection and Avoidance (Banker's Algorithm) for Distributed Systems.","hint":"Banker's: check if system in safe state after resource allocation.","testcases":[{"input":"3 processes 3 resources","expected":"safe state or deadlock"}]},
            {"id":5,"title":"Real-Time Scheduling","desc":"Implement Real-Time Scheduling algorithms: Rate Monotonic and Earliest Deadline First.","hint":"RMS: higher frequency → higher priority. EDF: closest deadline first.","testcases":[{"input":"tasks T1 T2 T3 with periods","expected":"schedule feasible or not"}]},
            {"id":6,"title":"Parallel Iterative Deepening A*","desc":"Parallel implementation of Iterative Deepening A* (IDA*) using threads.","hint":"IDA*: DFS with increasing depth limit = f(n). Parallelize across initial moves.","testcases":[{"input":"8-puzzle initial state","expected":"solution depth and path"}]},
        ]
    }
}

# ── DATABASE ────────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db(); c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL, register_number TEXT UNIQUE NOT NULL,
        department_id INTEGER DEFAULT 1, semester INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS code_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER,
        semester INTEGER, lab_code TEXT, exercise_id INTEGER,
        language TEXT NOT NULL, code TEXT NOT NULL, output TEXT,
        status TEXT DEFAULT 'pending', execution_time REAL,
        testcase_results TEXT DEFAULT '[]',
        all_passed INTEGER DEFAULT 0,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS active_sessions (
        id TEXT PRIMARY KEY, student_id INTEGER, student_name TEXT,
        started_at TEXT, last_activity TEXT, language TEXT, status TEXT DEFAULT 'active');
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL,
        title TEXT NOT NULL, language TEXT NOT NULL, code TEXT NOT NULL,
        description TEXT DEFAULT '', tags TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS exercise_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER, semester INTEGER, lab_code TEXT, exercise_id INTEGER,
        code TEXT, output TEXT, status TEXT, all_passed INTEGER DEFAULT 0,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, semester, lab_code, exercise_id));
    """)
    for dept in ["Computer Science & Engineering","Electronics & Communication","Information Technology","Mechanical Engineering"]:
        c.execute("INSERT OR IGNORE INTO departments (name) VALUES (?)",(dept,))
    c.execute("INSERT OR IGNORE INTO admins (username,password) VALUES (?,?)",("admin","admin123"))
    for name,email,reg,sem in [
        ("Jayasri","jay21@gmail.com","CS21001",1),
        ("Rahul Kumar","rahul@gmail.com","CS21002",3),
        ("Priya Sharma","priya@gmail.com","CS21003",4),
        ("Arjun Nair","arjun@gmail.com","CS21004",5),
        ("Meena Devi","meena@gmail.com","CS21005",6)]:
        c.execute("INSERT OR IGNORE INTO students (name,email,register_number,department_id,semester) VALUES (?,?,?,1,?)",(name,email,reg,sem))
    conn.commit(); conn.close()

init_db()

# ── WebSocket ────────────────────────────────────────────────────────────────────

class WS_Manager:
    def __init__(self): self.conns: List[WebSocket] = []
    async def connect(self, ws):
        await ws.accept(); self.conns.append(ws)
    def disconnect(self, ws):
        if ws in self.conns: self.conns.remove(ws)
    async def broadcast(self, msg):
        dead=[]
        for ws in self.conns:
            try: await ws.send_json(msg)
            except: dead.append(ws)
        for d in dead: self.conns.remove(d)

manager = WS_Manager()

# ── Models ───────────────────────────────────────────────────────────────────────

class StudentLogin(BaseModel): name:str; email:str
class AdminLogin(BaseModel): username:str; password:str
class StudentCreate(BaseModel): name:str; email:str; register_number:str; department_id:int=1; semester:int=1
class CodeRun(BaseModel):
    student_id:int; language:str; code:str
    semester:Optional[int]=None; lab_code:Optional[str]=None; exercise_id:Optional[int]=None
    session_id:Optional[str]=None; run_tests:bool=False
class RecordCreate(BaseModel): student_id:int; title:str; language:str; code:str; description:str=""; tags:str=""
class RecordUpdate(BaseModel): title:str; language:str; code:str; description:str=""; tags:str=""

# ── Execution Engine ─────────────────────────────────────────────────────────────

def run_proc(cmd, timeout=10, cwd=None, stdin_data=None):
    flags = subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0
    try:
        r = subprocess.run(cmd, input=stdin_data, capture_output=True, text=True,
                           timeout=timeout, cwd=cwd, creationflags=flags)
        return r.stdout, r.stderr, r.returncode
    except subprocess.TimeoutExpired: return "", "⏱ Timed out", -1
    except FileNotFoundError: return "", f"Not found: {cmd[0]}", -1
    except Exception as e: return "", str(e), -1

def execute(language:str, code:str, stdin:str="") -> dict:
    lang = language.lower().strip()
    start = time.time()
    try:
        with tempfile.TemporaryDirectory() as tmp:
            if lang == "python":
                if not PYTHON_EXE: return {"output":"❌ Python not found","status":"error","execution_time":0}
                f = os.path.join(tmp,"sol.py"); open(f,"w",encoding="utf-8").write(code)
                out,err,ret = run_proc([PYTHON_EXE,f],10,tmp,stdin)
                return {"output":out or err or "(no output)","status":"success" if ret==0 else "error","execution_time":round(time.time()-start,3)}
            elif lang=="c":
                if not GCC_EXE: return {"output":"❌ GCC not found.\nInstall MinGW: https://github.com/niXman/mingw-builds-binaries/releases\nExtract to C:\\mingw64, add C:\\mingw64\\bin to PATH","status":"not_installed","execution_time":0}
                src=os.path.join(tmp,"sol.c"); exe=os.path.join(tmp,"sol.exe" if IS_WINDOWS else "sol")
                open(src,"w",encoding="utf-8").write(code)
                _,err,ret=run_proc([GCC_EXE,src,"-o",exe,"-lm"],15)
                if ret!=0: return {"output":f"Compile Error:\n{err}","status":"error","execution_time":round(time.time()-start,3)}
                out,err,ret=run_proc([exe],10,tmp,stdin)
                return {"output":out or err or "(no output)","status":"success" if ret==0 else "error","execution_time":round(time.time()-start,3)}
            elif lang in("cpp","c++"):
                if not GPP_EXE: return {"output":"❌ G++ not found. Install MinGW.","status":"not_installed","execution_time":0}
                src=os.path.join(tmp,"sol.cpp"); exe=os.path.join(tmp,"sol.exe" if IS_WINDOWS else "sol")
                open(src,"w",encoding="utf-8").write(code)
                _,err,ret=run_proc([GPP_EXE,src,"-o",exe,"-std=c++17"],15)
                if ret!=0: return {"output":f"Compile Error:\n{err}","status":"error","execution_time":round(time.time()-start,3)}
                out,err,ret=run_proc([exe],10,tmp,stdin)
                return {"output":out or err or "(no output)","status":"success" if ret==0 else "error","execution_time":round(time.time()-start,3)}
            elif lang=="java":
                if not JAVAC_EXE: return {"output":"❌ Java JDK not found.\nInstall from: https://adoptium.net","status":"not_installed","execution_time":0}
                match=re.search(r'public\s+class\s+(\w+)',code); cn=match.group(1) if match else "Main"
                src=os.path.join(tmp,f"{cn}.java"); open(src,"w",encoding="utf-8").write(code)
                _,err,ret=run_proc([JAVAC_EXE,src],15,tmp)
                if ret!=0: return {"output":f"Compile Error:\n{err}","status":"error","execution_time":round(time.time()-start,3)}
                out,err,ret=run_proc([JAVA_EXE,"-cp",tmp,cn],10,tmp,stdin)
                return {"output":out or err or "(no output)","status":"success" if ret==0 else "error","execution_time":round(time.time()-start,3)}
            else: return {"output":f"Language '{language}' not supported","status":"error","execution_time":0}
    except Exception as e: return {"output":str(e),"status":"error","execution_time":0}

def run_testcases(language:str, code:str, testcases:list) -> list:
    results = []
    for tc in testcases:
        res = execute(language, code, tc.get("input",""))
        actual = res["output"].strip()
        expected = tc.get("expected","").strip()
        passed = expected.lower() in actual.lower() or actual == expected
        results.append({"input":tc.get("input",""),"expected":expected,"actual":actual,"passed":passed,"status":res["status"]})
    return results

# ── Auth ─────────────────────────────────────────────────────────────────────────

@app.post("/api/student/login")
def student_login(data: StudentLogin):
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT s.*, d.name as dept_name FROM students s LEFT JOIN departments d ON s.department_id=d.id WHERE s.name=? AND s.email=?",(data.name,data.email))
    s=c.fetchone(); conn.close()
    if not s: raise HTTPException(401,"Invalid credentials")
    return {"success":True,"student":dict(s)}

@app.post("/api/admin/login")
def admin_login(data: AdminLogin):
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT * FROM admins WHERE username=? AND password=?",(data.username,data.password))
    a=c.fetchone(); conn.close()
    if not a: raise HTTPException(401,"Invalid admin credentials")
    return {"success":True,"admin":{"id":a["id"],"username":a["username"]}}

# ── Students ──────────────────────────────────────────────────────────────────────

@app.get("/api/students")
def get_students():
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT s.*,d.name as dept_name FROM students s LEFT JOIN departments d ON s.department_id=d.id ORDER BY s.created_at DESC")
    r=[dict(x) for x in c.fetchall()]; conn.close(); return r

@app.post("/api/students")
def create_student(data: StudentCreate):
    conn=get_db(); c=conn.cursor()
    try:
        c.execute("INSERT INTO students (name,email,register_number,department_id,semester) VALUES (?,?,?,?,?)",(data.name,data.email,data.register_number,data.department_id,data.semester))
        conn.commit(); sid=c.lastrowid; conn.close(); return {"success":True,"id":sid}
    except sqlite3.IntegrityError as e: conn.close(); raise HTTPException(400,str(e))

@app.delete("/api/students/{sid}")
def del_student(sid:int):
    conn=get_db(); c=conn.cursor(); c.execute("DELETE FROM students WHERE id=?",(sid,)); conn.commit(); conn.close(); return {"success":True}

@app.get("/api/departments")
def get_departments():
    conn=get_db(); c=conn.cursor(); c.execute("SELECT * FROM departments"); r=[dict(x) for x in c.fetchall()]; conn.close(); return r

# ── Syllabus ──────────────────────────────────────────────────────────────────────

@app.get("/api/syllabus/{semester}")
def get_syllabus(semester: float):
    key = semester
    if key not in SYLLABUS:
        # try int
        key = int(semester) if int(semester) in SYLLABUS else None
    if not key: raise HTTPException(404,"No lab found for this semester")
    return SYLLABUS[key]

@app.get("/api/syllabus")
def get_all_syllabus():
    result = {}
    for k,v in SYLLABUS.items():
        result[str(k)] = {"lab":v["lab"],"code":v["code"],"language":v["language"],"exercise_count":len(v["exercises"])}
    return result

# ── Code Execution ─────────────────────────────────────────────────────────────

@app.get("/api/languages/status")
def lang_status():
    return {
        "python":{"available":PYTHON_EXE is not None,"path":PYTHON_EXE},
        "c":{"available":GCC_EXE is not None,"path":GCC_EXE},
        "cpp":{"available":GPP_EXE is not None,"path":GPP_EXE},
        "java":{"available":JAVAC_EXE is not None and JAVA_EXE is not None,"path":JAVAC_EXE},
    }

@app.post("/api/execute")
async def execute_route(data: CodeRun):
    result = execute(data.language, data.code)
    tc_results = []
    all_passed = False
    if data.run_tests and data.semester and data.lab_code and data.exercise_id:
        sem_key = data.semester
        if sem_key in SYLLABUS:
            lab = SYLLABUS[sem_key]
            ex = next((e for e in lab["exercises"] if e["id"]==data.exercise_id), None)
            if ex:
                tc_results = run_testcases(data.language, data.code, ex["testcases"])
                all_passed = all(t["passed"] for t in tc_results)
    import json as _json
    conn=get_db(); c=conn.cursor()
    c.execute("INSERT INTO code_submissions (student_id,semester,lab_code,exercise_id,language,code,output,status,execution_time,testcase_results,all_passed) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
              (data.student_id,data.semester,data.lab_code,data.exercise_id,data.language,data.code,result["output"],result["status"],result["execution_time"],_json.dumps(tc_results),1 if all_passed else 0))
    if data.run_tests and data.semester and data.lab_code and data.exercise_id and all_passed:
        c.execute("INSERT OR REPLACE INTO exercise_submissions (student_id,semester,lab_code,exercise_id,code,output,status,all_passed,submitted_at) VALUES (?,?,?,?,?,?,?,?,?)",
                  (data.student_id,data.semester,data.lab_code,data.exercise_id,data.code,result["output"],result["status"],1,datetime.now().isoformat()))
    conn.commit(); conn.close()
    if data.session_id:
        conn=get_db(); c=conn.cursor()
        c.execute("UPDATE active_sessions SET last_activity=?,language=? WHERE id=?",(datetime.now().isoformat(),data.language,data.session_id))
        conn.commit(); conn.close()
    await manager.broadcast({"type":"code_execution","student_id":data.student_id,"language":data.language,"status":result["status"],"timestamp":datetime.now().isoformat()})
    return {**result,"testcase_results":tc_results,"all_passed":all_passed}

@app.get("/api/exercise_status/{student_id}/{semester}/{lab_code}")
def get_exercise_status(student_id:int, semester:int, lab_code:str):
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT exercise_id,all_passed,submitted_at FROM exercise_submissions WHERE student_id=? AND semester=? AND lab_code=?",(student_id,semester,lab_code))
    r={row["exercise_id"]:{"passed":bool(row["all_passed"]),"submitted_at":row["submitted_at"]} for row in c.fetchall()}
    conn.close(); return r

# ── File Upload ───────────────────────────────────────────────────────────────────

@app.post("/api/upload_answer")
async def upload_answer(
    student_id: int,
    semester: int,
    lab_code: str,
    exercise_id: int,
    file: UploadFile = File(...)
):
    ext = os.path.splitext(file.filename)[1]
    fname = f"{student_id}_{semester}_{lab_code}_ex{exercise_id}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    content = await file.read()
    with open(fpath,"wb") as f: f.write(content)
    return {"success":True,"filename":fname,"size":len(content)}

# ── Records CRUD ──────────────────────────────────────────────────────────────────

@app.get("/api/records/{student_id}")
def get_records(student_id:int):
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT * FROM records WHERE student_id=? ORDER BY updated_at DESC",(student_id,))
    r=[dict(x) for x in c.fetchall()]; conn.close(); return r

@app.post("/api/records")
def create_record(data: RecordCreate):
    conn=get_db(); c=conn.cursor()
    now=datetime.now().isoformat()
    c.execute("INSERT INTO records (student_id,title,language,code,description,tags,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
              (data.student_id,data.title,data.language,data.code,data.description,data.tags,now,now))
    conn.commit(); rid=c.lastrowid; conn.close()
    return {"success":True,"id":rid}

@app.put("/api/records/{record_id}")
def update_record(record_id:int, data: RecordUpdate):
    conn=get_db(); c=conn.cursor()
    now=datetime.now().isoformat()
    c.execute("UPDATE records SET title=?,language=?,code=?,description=?,tags=?,updated_at=? WHERE id=?",(data.title,data.language,data.code,data.description,data.tags,now,record_id))
    conn.commit(); conn.close(); return {"success":True}

@app.delete("/api/records/{record_id}")
def delete_record(record_id:int):
    conn=get_db(); c=conn.cursor()
    c.execute("DELETE FROM records WHERE id=?",(record_id,))
    conn.commit(); conn.close(); return {"success":True}

# ── Sessions ──────────────────────────────────────────────────────────────────────

@app.post("/api/sessions/start")
async def start_session(payload:dict):
    sid=str(uuid.uuid4()); now=datetime.now().isoformat()
    conn=get_db(); c=conn.cursor()
    c.execute("INSERT INTO active_sessions (id,student_id,student_name,started_at,last_activity,language) VALUES (?,?,?,?,?,?)",
              (sid,payload.get("student_id"),payload.get("student_name"),now,now,"python"))
    conn.commit(); conn.close()
    await manager.broadcast({"type":"session_started","session_id":sid,"student_name":payload.get("student_name"),"timestamp":now})
    return {"session_id":sid}

@app.post("/api/sessions/end/{sid}")
async def end_session(sid:str):
    conn=get_db(); c=conn.cursor()
    c.execute("UPDATE active_sessions SET status='ended' WHERE id=?",(sid,))
    conn.commit(); conn.close()
    await manager.broadcast({"type":"session_ended","session_id":sid})
    return {"success":True}

@app.get("/api/sessions/active")
def active_sessions():
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT * FROM active_sessions WHERE status='active' ORDER BY started_at DESC")
    r=[dict(x) for x in c.fetchall()]; conn.close(); return r

# ── Analytics ─────────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
def analytics():
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM students"); ts=c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM code_submissions"); tsub=c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM code_submissions WHERE status='success'"); succ=c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM active_sessions WHERE status='active'"); act=c.fetchone()["count"]
    c.execute("SELECT language,COUNT(*) as count FROM code_submissions GROUP BY language ORDER BY count DESC"); ls=[dict(r) for r in c.fetchall()]
    c.execute("SELECT s.name,COUNT(cs.id) as submissions,SUM(CASE WHEN cs.status='success' THEN 1 ELSE 0 END) as successes FROM students s LEFT JOIN code_submissions cs ON s.id=cs.student_id GROUP BY s.id ORDER BY submissions DESC LIMIT 10"); ss=[dict(r) for r in c.fetchall()]
    c.execute("SELECT DATE(submitted_at) as date,COUNT(*) as count FROM code_submissions GROUP BY DATE(submitted_at) ORDER BY date DESC LIMIT 7"); ds=[dict(r) for r in c.fetchall()]
    conn.close()
    return {"total_students":ts,"total_submissions":tsub,"successful_submissions":succ,"active_sessions":act,"language_stats":ls,"student_stats":ss,"daily_stats":ds,"success_rate":round((succ/tsub*100) if tsub>0 else 0,1)}

@app.get("/api/submissions/{student_id}")
def get_subs(student_id:int):
    conn=get_db(); c=conn.cursor()
    c.execute("SELECT * FROM code_submissions WHERE student_id=? ORDER BY submitted_at DESC LIMIT 30",(student_id,))
    r=[dict(x) for x in c.fetchall()]; conn.close(); return r

# ── WebSocket ──────────────────────────────────────────────────────────────────────

@app.websocket("/ws/admin")
async def ws_admin(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            conn=get_db(); c=conn.cursor()
            c.execute("SELECT * FROM active_sessions WHERE status='active'")
            sess=[dict(r) for r in c.fetchall()]; conn.close()
            await ws.send_json({"type":"heartbeat","active_sessions":sess,"timestamp":datetime.now().isoformat()})
            await asyncio.sleep(5)
    except WebSocketDisconnect: manager.disconnect(ws)

if __name__=="__main__":
    import uvicorn
    uvicorn.run("main:app",host="0.0.0.0",port=8000,reload=True)
